// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

/// <reference path="../../typings/node.d.ts" />
/// <reference path="../../typings/Q.d.ts" />
/// <reference path="../../typings/tacoUtils.d.ts" />
/// <reference path="../../typings/rimraf.d.ts" />
/// <reference path="../../typings/cordovaExtensions.d.ts" />

"use strict";

import child_process = require ("child_process");
import fs = require ("fs");
import path = require ("path");
import Q = require ("q");
import rimraf = require ("rimraf");
import semver = require ("semver");

import Builder = require ("../common/builder");
import resources = require("../resources/resourceManager");
import utils = require ("taco-utils");

import BuildInfo = utils.BuildInfo;
import CordovaConfig = utils.CordovaConfig;
import Logger = utils.Logger;
import TacoPackageLoader = utils.TacoPackageLoader;
import UtilHelper = utils.UtilHelper;

process.on("message", function (buildRequest: { buildInfo: BuildInfo; language: string }): void {
    var buildInfo: BuildInfo = BuildInfo.createNewBuildInfoFromDataObject(buildRequest.buildInfo);
    process.env.TACO_LANG = buildRequest.language;
    if (WP8Builder.running) {
        buildInfo.updateStatus(BuildInfo.ERROR, "BuildInvokedTwice");
        process.send(buildInfo);
        process.exit(1);
    } else {
        WP8Builder.running = true;
    }

    var cordovaVersion: string = buildInfo["vcordova"];
    buildInfo.updateStatus(BuildInfo.BUILDING, "AcquiringCordova");
    process.send(buildInfo);
    TacoPackageLoader.lazyRequire<Cordova.ICordova540>("cordova", "cordova@" + cordovaVersion, buildInfo.logLevel).done(function (pkg: Cordova.ICordova540): void {
        var wp8Builder: WP8Builder = new WP8Builder(buildInfo, pkg);

        wp8Builder.build().done(function (resultBuildInfo: BuildInfo): void {
            process.send(resultBuildInfo);
        });
    }, function (err: Error): void {
        buildInfo.updateStatus(BuildInfo.ERROR, "RequireCordovaFailed", cordovaVersion, err.toString());
        process.send(buildInfo);
    });
});

class WP8Builder extends Builder {
    public static running: boolean = false;
    private cfg: CordovaConfig;

    constructor(currentBuild: BuildInfo, cordova: Cordova.ICordova540) {
        super(currentBuild, cordova);

        this.cfg = CordovaConfig.getCordovaConfig(currentBuild.appDir);
    }

    protected beforePrepare(): Q.Promise<any> {
        if (semver.lt(this.currentBuild["vcordova"], "5.3.3") && semver.gte(process.versions.node, "4.0.0")) {
            var preferences = this.cfg.preferences();
            if (preferences["target-device"] || preferences["deployment-target"]) {
                throw new Error(resources.getString("UnsupportedCordovaAndNodeVersion"));
            }
        }
        return Q({});
    }

    protected afterCompile(): Q.Promise<any> {
        return Q({});
    }

    protected package(): Q.Promise<any> {
        return Q({});
    }
}
