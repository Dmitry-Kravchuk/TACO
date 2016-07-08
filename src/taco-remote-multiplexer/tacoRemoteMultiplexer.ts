﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

/// <reference path="../typings/node.d.ts" />
/// <reference path="../typings/tacoRemoteMultiplexer.d.ts" />

import semver = require ("semver");
import path = require ("path");

var dependencyConfigPath: string = path.join(__dirname, "./dynamicDependencies.json");

class TacoRemoteMultiplexer implements TacoRemoteMultiplexer.ITacoRemoteMultiplexer {
    public getPackageSpecForQuery(query: TacoRemoteMultiplexer.IPropertyBag): TacoRemoteMultiplexer.IPackageSpec {
        // Note: As new scenarios are added, place them at the top of the function and not the bottom.
        // This will ensure that if previous scenarios worked, they will continue to do so, and newer cases take precedence over older ones.
        /*if (semver.valid(query["vcordova"]) && semver.gte(query["vcordova"], "5.4.0") && semver.lt(query["vcordova"], "6.2.0")) {
            return <TacoRemoteMultiplexer.IPackageSpec>{ packageKey: "latestTacoRemoteLib", dependencyConfigPath: dependencyConfigPath };
        }
        if (semver.valid(query["vcordova"]) && semver.satisfies(query["vcordova"], ">=3.0.0 <5.4.0")) {
            return <TacoRemoteMultiplexer.IPackageSpec>{ packageKey: "preCordova540TacoRemoteLib", dependencyConfigPath: dependencyConfigPath };
        }*/

        return <TacoRemoteMultiplexer.IPackageSpec> { packageKey: "latestTacoRemoteLib", dependencyConfigPath: dependencyConfigPath };
    }
};

var tacoRemoteMultiplexer: TacoRemoteMultiplexer = new TacoRemoteMultiplexer();
export = tacoRemoteMultiplexer;
