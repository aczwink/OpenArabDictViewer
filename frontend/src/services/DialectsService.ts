/**
 * OpenArabDictViewer
 * Copyright (C) 2024-2025 Amir Czwink (amir130@hotmail.de)
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

import { Injectable } from "acfrontend";
import { APIService } from "./APIService";
import { DialectType } from "openarabicconjugation/src/Dialects";
import { GetDialectMetadata } from "openarabicconjugation/dist/DialectsMetadata";
import { OpenArabDictDialect } from "openarabdict-domain";
import { DialectTree } from "openarabdict-openarabicconjugation-bridge";

@Injectable
export class DialectsService
{
    constructor(private apiService: APIService)
    {
        this.dialects = [];
    }

    //Public methods
    public async CacheDialects()
    {
        const response = await this.apiService.dialects.get();
        const dialects = response.data;

        this.dialects = dialects;
        DialectTree.DefineMultiple(dialects);
    }

    public FindDialect(dialectType: DialectType)
    {
        const id = DialectTree.MapTypeToId(dialectType);
        return this.dialects.find(x => x.id === id);
    }

    public GetDialect(dialectId: number)
    {
        return this.dialects.find(x => x.id === dialectId)!;
    }

    public GetDialectMetaData(dialectId: number)
    {
        const dialectType = this.MapIdToType(dialectId);
        if(dialectType === undefined)
            throw new Error("Method not implemented.2");
        return GetDialectMetadata(dialectType);
    }

    public MapIdToType(dialectId: number)
    {
        return DialectTree.MapIdToType(dialectId);
    }

    public QueryConjugatableDialects()
    {
        return this.dialects.filter(x => this.MapIdToType(x.id) !== undefined);
    }

    public QueryDialects()
    {
        return this.dialects;
    }

    //State
    private dialects: OpenArabDictDialect[];
}