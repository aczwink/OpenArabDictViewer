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

import { Injectable } from "acfrontend";
import { OpenArabDictVerbForm } from "openarabdict-domain";
import { GlobalSettingsService } from "./GlobalSettingsService";
import { DialectsService } from "./DialectsService";
import { DialectType } from "openarabicconjugation/src/Dialects";
import { GetDialectMetadata } from "openarabicconjugation/dist/DialectsMetadata";
import { CreateVerbFromOADVerbForm } from "openarabdict-openarabicconjugation-bridge";

@Injectable
export class VerbConjugationDialectResolver
{
    constructor(private globalSettingsService: GlobalSettingsService, private dialectsService: DialectsService)
    {
    }

    //Public methods
    public SelectDialect(rootRadicals: string, verbForm: OpenArabDictVerbForm): DialectType | null
    {
        const dialectId = this.dialectsService.FindDialect(this.globalSettingsService.dialectType)!.id;
        return this.WalkDialectTreeUpwards(dialectId, rootRadicals, verbForm);
    }

    //Private methods
    private IsDialectConjugatable(dialectType: DialectType, rootRadicals: string, verbForm: OpenArabDictVerbForm)
    {
        if(verbForm.variants !== undefined)
        {
            const dialectId = this.dialectsService.FindDialect(dialectType)!.id;
            const variant = verbForm.variants.find(x => x.dialectId === dialectId);
            if(variant === undefined)
                return false;
        }
        
        const verb = CreateVerbFromOADVerbForm(dialectType, rootRadicals, verbForm);
        return GetDialectMetadata(dialectType).IsConjugatable(verb);
    }

    private WalkDialectTreeUpwards(dialectId: number, rootRadicals: string, verbForm: OpenArabDictVerbForm)
    {
        while(true)
        {
            const dialectType = this.dialectsService.MapIdToType(dialectId);
            if((dialectType !== undefined) && this.IsDialectConjugatable(dialectType, rootRadicals, verbForm))
                return dialectType;

            const dialect = this.dialectsService.GetDialect(dialectId);
            if(dialect.parentId === null)
                break;
            dialectId = dialect.parentId;
        }

        return null;
    }
}