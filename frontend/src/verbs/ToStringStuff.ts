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
import { VerbType } from "openarabicconjugation/src/Definitions";

export function ConjugationSchemeToString(scheme: VerbType): string
{
    switch(scheme)
    {
        case VerbType.Assimilated:
            return "Assimilated";
        case VerbType.AssimilatedAndDefective:
            return "Assimilated + Defective";
        case VerbType.Defective:
            return "Defective";
        case VerbType.Geminate:
            return "Geminate";
        case VerbType.HamzaOnR1:
            return "Hamza on R1";
        case VerbType.Hollow:
            return "Hollow";
        case VerbType.Sound:
        case VerbType.SoundQuadriliteral:
            return "Sound";
    }
}