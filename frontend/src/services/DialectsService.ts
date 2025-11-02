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
import { DialectData } from "../../dist/api";
import { DialectType } from "openarabicconjugation/src/Dialects";
import { GetDialectMetadata } from "openarabicconjugation/dist/DialectsMetadata";
import { Dictionary } from "acts-util-core";

@Injectable
export class DialectsService
{
    constructor(private apiService: APIService)
    {
        this.dialects = [];
        this.dialectTypeMap = {};
    }

    //Public methods
    public async CacheDialects()
    {
        const response = await this.apiService.dialects.get();
        const dialects = response.data;
        this.dialects = dialects;

        const types: DialectType[] = [DialectType.ModernStandardArabic, DialectType.Lebanese, DialectType.SouthLevantine];
        for (const type of types)
        {
            for (const dialect of dialects)
            {
                if(this.Match(type, dialect))
                {
                    this.dialectTypeMap[dialect.id] = type;
                }
            }
        }
    }

    public FindDialect(dialectType: DialectType)
    {
        return this.dialects.find(x => this.Match(dialectType, x));
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
        const dialectType = this.dialectTypeMap[dialectId];
        return dialectType;
    }

    public QueryConjugatableDialects()
    {
        return this.dialects.filter(x => this.dialectTypeMap[x.id] !== undefined);
    }

    public QueryDialects()
    {
        return this.dialects;
    }

    //Private methods
    private Match(type: DialectType, dialect: DialectData)
    {
        const metaData = GetDialectMetadata(type);
        if( (dialect.iso639code === metaData.iso639code) && (dialect.glottoCode === metaData.glottoCode) )
            return true;
        return false;
    }

    //State
    private dialects: DialectData[];
    private dialectTypeMap: Dictionary<DialectType>;
}