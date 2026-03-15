/**
 * OpenArabDictViewer
 * Copyright (C) 2023-2026 Amir Czwink (amir130@hotmail.de)
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

import { Injectable } from "@aczwink/acfrontend";
import { OpenArabDictVerbForm, OpenArabDictWordType } from "@aczwink/openarabdict-domain";
import { GlobalSettingsService } from "./GlobalSettingsService";
import { DialectsService } from "./DialectsService";
import { GetDialectMetadata } from "@aczwink/openarabicconjugation/dist/DialectsMetadata";
import { CreateVerbFromOADVerbForm } from "@aczwink/openarabdict-openarabicconjugation-bridge";
import { DialectType, GetAllConjugatableDialects } from "@aczwink/openarabicconjugation/dist/Dialects";
import { WordWithConnections } from "./CachedAPIService";

@Injectable
export class VerbConjugationDialectResolver
{
    constructor(private globalSettingsService: GlobalSettingsService, private dialectsService: DialectsService)
    {
    }

    //Public methods
    public IsNativeConjugationPossible(dialectType: DialectType, word: WordWithConnections)
    {
        if(word.word.type !== OpenArabDictWordType.Verb)
            return false;

        const dialectIds = word.translations.map(x => x.dialectId);
        if(word.word.form.variants !== undefined)
            dialectIds.push(...word.word.form.variants.map(x => x.dialectId));
        if(dialectIds.IsEmpty() && (dialectType === DialectType.ModernStandardArabic))
            return true; //assume MSA
        return dialectIds.find(x => this.dialectsService.MapIdToType(x) === dialectType) !== undefined;
    }

    public SelectDialect(rootRadicals: string, verbForm: OpenArabDictVerbForm): DialectType | null
    {
        const dialects = this.FindConjugatableDialects(rootRadicals, verbForm);
        const dialectType = this.ChooseClosestDialect(dialects);

        return dialectType;
    }

    //Private methods
    private ChooseClosestDialect(dialects: DialectType[])
    {
        let bestDistance = Number.MAX_SAFE_INTEGER;
        let bestDialect = null;

        const desired = this.globalSettingsService.dialectType;
        for (const dialect of dialects)
        {
            const d = this.GetDistance(desired, dialect);
            if(d < bestDistance)
            {
                bestDistance = d;
                bestDialect = dialect;
            }
        }

        return bestDialect;
    }

    private FindConjugatableDialects(rootRadicals: string, verbForm: OpenArabDictVerbForm)
    {
        let dialects;
        if(verbForm.variants === undefined)
            dialects = GetAllConjugatableDialects();
        else
            dialects = verbForm.variants.map(x => this.dialectsService.MapIdToType(x.dialectId)).filter(x => x !== undefined);

        return dialects.filter(x => this.IsDialectConjugatable(x, rootRadicals, verbForm));
    }

    private GetDistance(d1: DialectType, d2: DialectType): number
    {
        if(d1 === d2)
            return 0;
        if(d1 > d2)
            return this.GetDistance(d2, d1);

        const distances = [
            { d1: DialectType.Lebanese, d2: DialectType.ModernStandardArabic, d: 2 },
            { d1: DialectType.Lebanese, d2: DialectType.SouthLevantine, d: 1 },
            { d1: DialectType.ModernStandardArabic, d2: DialectType.SouthLevantine, d: 2 },
        ];

        for (const pairs of distances)
        {
            if((pairs.d1 === d1) && (pairs.d2 === d2))
                return pairs.d;
        }
        throw new Error("Can't reach this!");
    }

    private IsDialectConjugatable(dialectType: DialectType, rootRadicals: string, verbForm: OpenArabDictVerbForm)
    {
        const verb = CreateVerbFromOADVerbForm(dialectType, rootRadicals, verbForm);
        return GetDialectMetadata(dialectType).IsConjugatable(verb);
    }
}