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

import { RootType, VerbRoot } from "openarabicconjugation/src/VerbRoot";
import { Letter } from "openarabicconjugation/src/Definitions";
import { IsValidRootRadical } from "openarabicconjugation/src/Util";
import { OpenArabDictRoot } from "openarabdict-domain";

export function AreValidRootCharacters(rootRadicals: string)
{
    const chars = rootRadicals.split("");
    if(chars.length > 4)
        return false;
    return chars.Values().Map(IsValidRootRadical).All();
}

export function DoRootCharactersFormValidRoot(rootRadicals: string)
{
    const chars = rootRadicals.split("");
    if(chars.length < 3)
        return false;
    if(chars.length > 4)
        return false;
    return AreValidRootCharacters(rootRadicals);
}

export function RootToString(rootData: OpenArabDictRoot)
{
    const root = new VerbRoot(rootData.radicals);

    if(rootData.ya === true)
    {
        switch(root.type)
        {
            case RootType.FinalWeak:
                {
                    const radicalsYa = rootData.radicals.substring(0, 2) + Letter.Ya;
                    const root2 = new VerbRoot(radicalsYa);
                    return root.ToString() + " / " + root2.ToString();
                }
            case RootType.MiddleWeak:
                {
                    const radicalsYa = root.r1 + Letter.Ya + root.r3;
                    const root2 = new VerbRoot(radicalsYa);
                    return root.ToString() + " / " + root2.ToString();
                }
        }
    }

    return root.ToString();
}

export function RootTypeToPattern(rootType: RootType)
{
    switch(rootType)
    {
        case RootType.InitialWeak:
            return "(و|ي)-r2-r3";
        case RootType.FinalWeak:
            return "r1-r2-(و|ي)";
        case RootType.DoublyWeak_WawOnR1_WawOrYaOnR3:
            return "و-r2-(و|ي)";
        case RootType.HamzaOnR1:
            return "ء-r2-r3";
        case RootType.MiddleWeak:
            return "r1-(و|ي)-r3";
        case RootType.Quadriliteral:
            return "r1-r2-r3-r4";
        case RootType.SecondConsonantDoubled:
            return "r1-r2-r2";
        case RootType.Regular:
            return "r1-r2-r3";
    }
}

export function RootTypeToString(rootType: RootType)
{
    switch(rootType)
    {
        case RootType.InitialWeak:
            return "Initial-weak";
        case RootType.FinalWeak:
            return "final-weak";
        case RootType.DoublyWeak_WawOnR1_WawOrYaOnR3:
            return "Doubly-weak";
        case RootType.HamzaOnR1:
            return "Hamza on first radical";
        case RootType.MiddleWeak:
            return "middle-weak";
        case RootType.Quadriliteral:
            return "Quadriliteral";
        case RootType.SecondConsonantDoubled:
            return "Second consonant doubled";
        case RootType.Regular:
            return "regular";
    }
}