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

import { JSX_CreateElement, JSX_Fragment } from "@aczwink/acfrontend";
import { LexemeIdReferenceComponent } from "./WordReferenceComponent";
import { WordDerivationTypeFromWordToString } from "../shared/words";
import { OpenArabDictParent, OpenArabDictParentType } from "@aczwink/openarabdict-domain";
import { RootIdReferenceComponent } from "../roots/RootReferenceComponent";

function DerivationToText(relationType: OpenArabDictParentType, outgoing: boolean): string
{
    if(outgoing)
        return WordDerivationTypeFromWordToString(relationType);

    switch(relationType)
    {
        case OpenArabDictParentType.ActiveParticiple:
        case OpenArabDictParentType.PassiveParticiple:
        case OpenArabDictParentType.VerbalNoun:
            return "base verb";
        case OpenArabDictParentType.MeaningRelated:
            return "related in meaning";
        case OpenArabDictParentType.Feminine:
            return "male version";
        case OpenArabDictParentType.Plural:
            return "singular";
        case OpenArabDictParentType.Nisba:
            return "noun version";
        case OpenArabDictParentType.Colloquial:
            return "فصحى version";
        case OpenArabDictParentType.AdverbialAccusative:
        case OpenArabDictParentType.ComposedOf:
        case OpenArabDictParentType.Extension:
        case OpenArabDictParentType.InstanceNoun:
            return "base";
        case OpenArabDictParentType.ElativeDegree:
            return "positive degree";
        case OpenArabDictParentType.Singulative:
            return "collective";
        case OpenArabDictParentType.DefiniteState:
            return "indefinitive state";
        default:
            throw new Error("Unknown type: " + relationType + "_" + outgoing);
    }
}

export function RenderDerivedTerm(outgoing: boolean, relation: OpenArabDictParent)
{
    return <>
        {DerivationToText(relation.type, outgoing)} of <LexemeIdReferenceComponent lexemeId={relation.id} />
    </>;
}

export function WordDerivationComponent(input: { parent: OpenArabDictParent[]; })
{
    function RenderEntry(x: OpenArabDictParent)
    {
        if(x.type === OpenArabDictParentType.Root)
            return <RootIdReferenceComponent rootId={x.id} />;
        return RenderDerivedTerm(true, x);
    }
    
    if(input.parent.length === 1)
        return RenderEntry(input.parent[0]);
    
    return <ul>
        {input.parent.map(x => <li>{RenderEntry(x)}</li>)}
    </ul>;
}