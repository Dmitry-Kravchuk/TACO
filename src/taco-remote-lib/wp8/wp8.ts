// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

/// <reference path="../../typings/node.d.ts" />
/// <reference path="../../typings/tacoUtils.d.ts" />
/// <reference path="../../typings/express.d.ts" />
/// <reference path="../../typings/archiver.d.ts" />
/// <reference path="../../typings/idevice-app-launcher.d.ts" />
/// <reference path="../ITargetPlatform.d.ts" />

"use strict";

import child_process = require("child_process");
import fs = require("fs");
import net = require("net");
import path = require("path");
import Q = require("q");
import util = require("util");
import archiver = require("archiver");

import resources = require("../resources/resourceManager");
import utils = require("taco-utils");

import BuildInfo = utils.BuildInfo;
import Logger = utils.Logger;
import ProcessLogger = utils.ProcessLogger;
import UtilHelper = utils.UtilHelper;

class WP8Agent implements ITargetPlatform {

    /**
     * Initialize wp8 specific information from the configuration.
     * 
     * @param {IReadOnlyConf} config A dictionary of user-provided parameters
     */
    constructor(config: { get(key: string): any; }) {

    }

    public canServiceRequest(buildInfo: BuildInfo): boolean {
        return buildInfo.buildPlatform.toLowerCase() === "wp8";
    }

    /**
     * Launch an app on an wp8 device attached to the build server
     * 
     * @param {BuildInfo} buildInfo Information specifying the build
     * @param {express.Request} req The HTTP request being serviced
     * @param {express.Response} res The response to the HTTP request, which must be sent by this function
     */
    public runOnDevice(buildInfo: BuildInfo, req: Express.Request, res: Express.Response): void {
    }

    public downloadBuild(buildInfo: BuildInfo, req: Express.Request, res: Express.Response, callback: (err: any) => void): void {
        var wp8OutputDir: string = path.join(buildInfo.appDir, "platforms", "wp8", "Bin", "device");
        var pathToManifestFile: string = path.join(wp8OutputDir, buildInfo["appName"] + ".xaml");
        var pathToPackageFile: string = path.join(wp8OutputDir, buildInfo["appName"] + ".xap");
        var pathToBuildZipFile: string = path.join(wp8OutputDir, buildInfo["appName"] + ".zip");

        if (!fs.existsSync(pathToManifestFile) || !fs.existsSync(pathToPackageFile)) {
            var msg: string = resources.getString("DownloadInvalid", pathToManifestFile, pathToPackageFile);
            Logger.log(msg);
            res.status(404).send(resources.getStringForLanguage(req, "DownloadInvalid", pathToManifestFile, pathToPackageFile));
            callback(msg);
            return;
        }

        Q({})
            .then(function(): Q.Promise<any> {
                var deferred: Q.Deferred<any> = Q.defer();

                var outputStream: fs.WriteStream = fs.createWriteStream(pathToBuildZipFile);
                var archive: any = archiver("zip");
                archive.on("error", function(err: Error): void {
                    return deferred.reject(err);
                });
                outputStream.on("finish", function() {
                    return deferred.resolve({});
                });

                archive.pipe(outputStream);
                archive.file(pathToManifestFile, { name: buildInfo["appName"] + ".xaml" });
                archive.file(pathToPackageFile, { name: buildInfo["appName"] + ".xap" });
                archive.finalize();

                return deferred.promise;
            })
            .then(function(): void {
                var deferred: Q.Deferred<any> = Q.defer();
                var inputStream: fs.ReadStream = fs.createReadStream(pathToBuildZipFile);

                res.set({ "Content-Type": "application/zip" });
                inputStream.pipe(res);
                callback(null);
            })
            .catch(function(err: any): void {
                Logger.logError(resources.getString("ArchivePackError", err.message));
                callback(err);
                res.status(404).send(resources.getStringForLanguage(req, "ArchivePackError", err.message));
            });
    }

    public emulateBuild(buildInfo: utils.BuildInfo, req: Express.Request, res: Express.Response): void {
    }

    public deployBuildToDevice(buildInfo: utils.BuildInfo, req: Express.Request, res: Express.Response): void {

    }

    public debugBuild(buildInfo: utils.BuildInfo, req: Express.Request, res: Express.Response): void {

    }

    public createBuildProcess(): child_process.ChildProcess {
        return child_process.fork(path.join(__dirname, "wp8Build.js"), [], { silent: true });
    }
}

export = WP8Agent;
