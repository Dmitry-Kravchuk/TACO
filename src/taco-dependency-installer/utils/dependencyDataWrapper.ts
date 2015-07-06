/**
 *******************************************************
 *                                                     *
 *   Copyright (C) Microsoft. All rights reserved.     *
 *                                                     *
 *******************************************************
 */

/// <reference path="../../typings/dependencyInstallerInterfaces.d.ts" />

"use strict";

import fs = require ("fs");
import os = require ("os");
import path = require ("path");

class DependencyDataWrapper {
    private static DefaultDependenciesMetadataFilePath: string = path.resolve(__dirname, "..", "platformDependencies.json");

    private dependenciesData: DependencyInstallerInterfaces.IDependencyDictionary;

    constructor(dependenciesMetadataFilePath?: string) {
        var loadPath: string = dependenciesMetadataFilePath || DependencyDataWrapper.DefaultDependenciesMetadataFilePath;

        this.dependenciesData = JSON.parse(fs.readFileSync(loadPath, "utf8"));
    }

    /*
     * Returns the installation destination for the specified dependency ID, version ID and platform ID (or the current system platform if no platform is specified).
     * Will return null if the info is missing from our metadata or if either the dependency ID, the version ID or the platform ID does not exist.
     */
    public getInstallDirectory(id: string, version: string, platform: string = process.platform, architecture: string = os.arch()): string {
        if (this.dependenciesData[id] && this.dependenciesData[id].versions && this.dependenciesData[id].versions[version] && this.dependenciesData[id].versions[version][platform] && this.dependenciesData[id].versions[version][platform][architecture]) {
            return this.dependenciesData[id].versions[version][platform][architecture].installDestination;
        }

        return null;
    }

    /*
     * Returns the display name for the specified dependency. Will return null if the info is missing in our metadata or if the dependency does not exist.
     */
    public getDisplayName(id: string): string {
        if (this.dependenciesData[id]) {
            return this.dependenciesData[id].displayName;
        }

        return null;
    }

    /*
     * Returns the path to the specialized installer class of the specified dependency, or null if the dependency doesn't exist.
     */
    public getInstallerPath(id: string): string {
        if (this.dependenciesData[id]) {
            return this.dependenciesData[id].installerPath;
        }

        return null;
    }

    /*
     * Returns the license url for the specified dependency. Will return null if the info is missing in our metadata or if the dependency does not exist.
     */
    public getLicenseUrl(id: string): string {
        if (this.dependenciesData[id]) {
            return this.dependenciesData[id].licenseUrl;
        }

        return null;
    }

    /*
     * Returns the list of prerequisites for the specified dependency. Will return null if the info is missing in our metadata or if the dependency does not exist.
     */
    public getPrerequisites(id: string): string[] {
        if (this.dependenciesData[id]) {
            return this.dependenciesData[id].prerequisites;
        }

        return null;
    }

    /*
     * Returns the installer info for the specified dependency. Will return null if either the dependency ID, the version ID or the platform (or the current system
     * platform if no platform is specified) ID does not exist.
     */
    public getInstallerInfo(id: string, version: string, platform: string = process.platform, architecture: string = os.arch()): DependencyInstallerInterfaces.IInstallerData {
        if (this.dependenciesData[id] && this.dependenciesData[id].versions && this.dependenciesData[id].versions[version] && this.dependenciesData[id].versions[version][platform]) {
            return this.dependenciesData[id].versions[version][platform][architecture];
        }

        return null;
    }

    /*
     * Looks into the specified dependency node and returns the first version ID that contains a node for either the specified platform (or the current system
     * platform if no platform is specified) or the "default" platform. Returns null if no such version ID exists.
     */
    public getFirstValidVersion(id: string, platform: string = process.platform, architecture: string = os.arch()): string {
        var self = this;
        var validVersion: string;

        if (this.dependenciesData[id] && this.dependenciesData[id].versions) {
            Object.keys(this.dependenciesData[id].versions).some(function (version: string): boolean {
                if (self.isSystemSupported(id, version, platform, architecture)) {
                    validVersion = version;

                    return true;
                }

                return false;
            });
        }

        return validVersion;
    }

    /*
     * Returns true if the specified dependency exists, false otherwise.
     */
    public dependencyExists(id: string): boolean {
        return !!this.dependenciesData[id];
    }

    /*
     * Returns true if the specified dependency has a node for the specified version, false otherwise.
     */
    public versionExists(id: string, version: string): boolean {
        return !!this.dependenciesData[id] && !!this.dependenciesData[id].versions && !!this.dependenciesData[id].versions[version];
    }

    /*
     * Returns true if the specified dependency has a node for the specified version and that version has a node for either the specified platform (or the current
     * system platform if no platform is specified), or the "default" platform. Returns false otherwise.
     */
    public isSystemSupported(id: string, version: string, platform: string = process.platform, architecture: string = os.arch()): boolean {
        return !!this.dependenciesData[id] &&
            !!this.dependenciesData[id].versions &&
            !!this.dependenciesData[id].versions[version] &&
            !!this.dependenciesData[id].versions[version][platform] &&
            !!this.dependenciesData[id].versions[version][platform][architecture];
    }

    /*
     * Returns true if the specified dependency is implicit, false if it isn't or if the specified ID does not exist. A dependency is implicit if it is installed as part of a different dependency. For
     * example, Android packages (android-21, android-platform-tools, etc) are installed directly as part of installing Android SDK in this dependency installer, so we don't want to do extra processing
     * to handle these packages specifically. Thus, they are marked as implicit dependencies.
     */
    public isImplicit(id: string): boolean {
        return !!this.dependenciesData[id] && !!this.dependenciesData[id].isImplicit;
    }
}

export = DependencyDataWrapper;