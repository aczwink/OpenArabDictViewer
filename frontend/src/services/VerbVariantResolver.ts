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
import { OpenArabDictVerbType, OpenArabDictVerbForm } from "openarabdict-domain";
import { AdvancedStemNumber } from "openarabicconjugation/src/Definitions";
import { GlobalSettingsService } from "./GlobalSettingsService";
import { DialectsService } from "./DialectsService";

export interface VerbVariant
{
    dialectId: number;
    stem: string | AdvancedStemNumber;
    verbType?: OpenArabDictVerbType;
}

@Injectable
export class VerbVariantResolver
{
    constructor(private globalSettingsService: GlobalSettingsService, private dialectsService: DialectsService)
    {
    }
    
    public SelectVerbVariant(verbForm: OpenArabDictVerbForm): VerbVariant
    {
        const targetDialect = this.dialectsService.FindDialect(this.globalSettingsService.dialectType)!;
        const variant = this.WalkDialectTree(targetDialect.id, verbForm) ?? this.SelectRandomVariant(verbForm);

        if((typeof variant.stem === "number") && (verbForm.verbType === undefined))
        {
            return {
                dialectId: targetDialect.id,
                stem: variant.stem
            };
        }

        return variant;
    }

    //Private methods
    private SelectRandomVariant(verbForm: OpenArabDictVerbForm): VerbVariant
    {
        const v = verbForm.variants[0];
        return {
            dialectId: v.dialectId,
            stem: v.stemParameters ?? (verbForm.stem as AdvancedStemNumber),
            verbType: verbForm.verbType
        };
    }

    private TryFindMatchingVariant(verbForm: OpenArabDictVerbForm, desiredDialectId: number): VerbVariant | undefined
    {
        const variant = verbForm.variants.find(x => x.dialectId === desiredDialectId);
        if(variant === undefined)
            return undefined;
        
        return {
            dialectId: variant.dialectId,
            stem: variant.stemParameters ?? (verbForm.stem as AdvancedStemNumber),
            verbType: verbForm.verbType,
        };
    }

    private WalkDialectTree(dialectId: number, verbForm: OpenArabDictVerbForm)
    {
        while(true)
        {
            const result = this.TryFindMatchingVariant(verbForm, dialectId);
            if(result !== undefined)
                return result;

            const dialect = this.dialectsService.GetDialect(dialectId);
            if(dialect.parentId === null)
                return undefined;
            dialectId = dialect.parentId;
        }
    }
}