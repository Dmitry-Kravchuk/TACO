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

class WindowsAgent implements ITargetPlatform {

    /**
     * Initialize windows specific information from the configuration.
     * 
     * @param {IReadOnlyConf} config A dictionary of user-provided parameters
     */
    constructor(config: { get(key: string): any; }) {

    }

    public canServiceRequest(buildInfo: BuildInfo): boolean {
        return buildInfo.buildPlatform.toLowerCase() === "windows";
    }

    /**
     * Launch an app on an windows device attached to the build server
     * 
     * @param {BuildInfo} buildInfo Information specifying the build
     * @param {express.Request} req The HTTP request being serviced
     * @param {express.Response} res The response to the HTTP request, which must be sent by this function
     */
    public runOnDevice(buildInfo: BuildInfo, req: Express.Request, res: Express.Response): void {
    }

    public downloadBuild(buildInfo: BuildInfo, req: Express.Request, res: Express.Response, callback: (err: any) => void): void {
        var windowsOutputDir: string = path.join(buildInfo.appDir, "platforms", "windows", "AppPackages");
        var deviceAppName: string = "CordovaApp.Phone_0.0.1.0_anycpu";
        var platformAppName: string = "CordovaApp.Windows_0.0.1.0_anycpu";
        if(buildInfo.configuration === "debug"){
            deviceAppName += "_debug";
            platformAppName += "_debug";
        }
        var pathToDeviceManifestFile: string = path.join(windowsOutputDir, deviceAppName + ".appxupload");
        var pathToDevicePackageFile: string = path.join(windowsOutputDir, deviceAppName + '_Test', deviceAppName + ".appx");
        var pathToDesktopManifestFile: string = path.join(windowsOutputDir, platformAppName + ".appxupload");
        var pathToDesktopPackageFile: string = path.join(windowsOutputDir, platformAppName + '_Test', platformAppName + ".appx");
        var pathToBuildZipFile: string = path.join(windowsOutputDir, buildInfo["appName"] + ".zip");

        if (!fs.existsSync(pathToDeviceManifestFile) ||
            !fs.existsSync(pathToDevicePackageFile) ||
            !fs.existsSync(pathToDesktopManifestFile) ||
            !fs.existsSync(pathToDesktopPackageFile)) {
            var msg: string = resources.getString("DownloadInvalid", pathToDeviceManifestFile, pathToDevicePackageFile, pathToDesktopManifestFile, pathToDesktopPackageFile);
            Logger.log(msg);
            res.status(404).send(resources.getStringForLanguage(req, "DownloadInvalid", pathToDeviceManifestFile, pathToDevicePackageFile, pathToDesktopManifestFile, pathToDesktopPackageFile));
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
                archive.file(pathToDeviceManifestFile, { name: buildInfo["appName"] + "_Phone" + ".appxupload" });
                archive.file(pathToDevicePackageFile, { name: buildInfo["appName"] + "_Phone" + ".appx" });
                archive.file(pathToDesktopManifestFile, { name: buildInfo["appName"] + "_Windows" + ".appxupload" });
                archive.file(pathToDesktopPackageFile, { name: buildInfo["appName"] + "_Windows" + ".appx" });
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
        return child_process.fork(path.join(__dirname, "windowsBuild.js"), [], { silent: true });
    }
}

export = WindowsAgent;
