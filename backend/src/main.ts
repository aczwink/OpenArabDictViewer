/**
 * OpenArabDictViewer
 * Copyright (C) 2023-2025 Amir Czwink (amir130@hotmail.de)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * */
import http from "http";

import { OpenAPI } from "acts-util-core";
import { Factory, GlobalInjector, HTTP } from "acts-util-node";
import { APIRegistry } from "acts-util-apilib";
import { RootsIndexService } from "./services/RootsIndexService";
import { DialectsService } from "./services/DialectsService";
import { ArabicTextIndexService } from "./services/ArabicTextIndexService";
import ENV from "./env";
import { DialectTree } from "openarabdict-openarabicconjugation-bridge";
import { DialectsController } from "./data-access/DialectsController";

async function ComputeIndexes()
{
    const dialectsService = GlobalInjector.Resolve(DialectsService);
    const rootsIndexService = GlobalInjector.Resolve(RootsIndexService);
    const arabicTextIndexService = GlobalInjector.Resolve(ArabicTextIndexService);

    const mem1 = process.memoryUsage();

    await dialectsService.RebuildIndex();
    await rootsIndexService.RebuildIndex();
    await arabicTextIndexService.RebuildIndex();

    const mem2 = process.memoryUsage();

    console.log("Memory in use:", mem2.rss.FormatBinaryPrefixed());
    console.log("Memory in use by indexes:", (mem2.rss - mem1.rss).FormatBinaryPrefixed());
}

async function DefineDialects()
{
    const dialectsController = GlobalInjector.Resolve(DialectsController);
    const dialects = await dialectsController.QueryDialects();
    DialectTree.DefineMultiple(dialects);
}

async function SetupServer()
{
    await DefineDialects();
    
    console.log("Computing indexes...");
    await ComputeIndexes();
    console.log("Finished computing indexes...");

    const requestHandlerChain = Factory.CreateRequestHandlerChain();
    requestHandlerChain.AddCORSHandler([ENV.corsOrigin]);
    requestHandlerChain.AddBodyParser();

    await import("./__http_registry");

    const openAPIDef: OpenAPI.Root = (await import("../dist/openapi.json")) as any;
    const backendStructure: any = await import("../dist/openapi-structure.json");
    requestHandlerChain.AddRequestHandler(new HTTP.RouterRequestHandler(openAPIDef, backendStructure, APIRegistry.endPointTargets));

    const server = http.createServer(requestHandlerChain.requestListener);

    server.listen(ENV.serverPort, () => {
        console.log("Server is running...");
    });

    process.on('SIGINT', function()
    {
        console.log("Shutting server down...");
        server.close();
    });
}

SetupServer();