/**
 * OpenArabDictViewer
 * Copyright (C) 2025 Amir Czwink (amir130@hotmail.de)
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

import { Injectable } from "acts-util-node";
import { DialectType, GetAllConjugatableDialects } from "openarabicconjugation/src/Dialects";
import { DialectsController } from "../data-access/DialectsController";
import { GetDialectMetadata } from "openarabicconjugation/src/DialectsMetadata";

@Injectable
export class DialectsService
{
    constructor(private dialectsController: DialectsController)
    {
        this.dialectMap = new Map();
        this.reverseDialectMap = new Map();
    }

    //Public methods
    public GetDialectMetaData(dialectId: number)
    {
        const type = this.dialectMap.get(dialectId);
        if(type === undefined)
            throw new Error("Dialect not conjugatable");
        
        return GetDialectMetadata(type);
    }

    public MapDialectId(dialectId: number)
    {
        return this.dialectMap.get(dialectId);
    }

    public MapDialectType(dialectType: DialectType)
    {
        return this.reverseDialectMap.get(dialectType)!;
    }

    public async RebuildIndex()
    {
        const dialects = await this.dialectsController.QueryDialects();
        const conjugatable = GetAllConjugatableDialects();

        const map = new Map();
        const reverseMap = new Map();
        for (const dialectType of conjugatable)
        {
            const md = GetDialectMetadata(dialectType);
            const dialect = dialects.find(x => (md.glottoCode === x.glottoCode) && (md.iso639code === x.iso639code));

            map.set(dialect!.id, dialectType);
            reverseMap.set(dialectType, dialect!.id);
        }
        
        this.dialectMap = map;
        this.reverseDialectMap = reverseMap;
    }

    //State
    private dialectMap: Map<number, DialectType>;
    private reverseDialectMap: Map<DialectType, number>;
}