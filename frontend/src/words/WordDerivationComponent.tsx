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

import { JSX_CreateElement, JSX_Fragment } from "acfrontend";
import { OpenArabDictNonVerbDerivationType, OpenArabDictVerbDerivationType } from "../../dist/api";
import { WordIdReferenceComponent } from "./WordReferenceComponent";
import { WordDerivationTypeFromWordToString } from "../shared/words";
import { OpenArabDictOtherWordParent, OpenArabDictWordParent, OpenArabDictWordParentType, OpenArabDictWordVerbParent } from "openarabdict-domain";
import { RootIdReferenceComponent } from "../roots/RootReferenceComponent";

function RelationshipToText(relationType: OpenArabDictNonVerbDerivationType, outgoing: boolean): string
{
    if(outgoing)
        return WordDerivationTypeFromWordToString(relationType);

    switch(relationType)
    {
        case OpenArabDictNonVerbDerivationType.Feminine:
            return "male version";
        case OpenArabDictNonVerbDerivationType.Plural:
            return "singular";
        case OpenArabDictNonVerbDerivationType.Nisba:
            return "noun version";
        case OpenArabDictNonVerbDerivationType.Colloquial:
            return "فصحى version";
        case OpenArabDictNonVerbDerivationType.AdverbialAccusative:
        case OpenArabDictNonVerbDerivationType.Extension:
        case OpenArabDictNonVerbDerivationType.InstanceNoun:
            return "base";
        case OpenArabDictNonVerbDerivationType.ElativeDegree:
            return "positive degree";
        case OpenArabDictNonVerbDerivationType.Singulative:
            return "collective";
    }
}

export function RenderDerivedTerm(outgoing: boolean, relation: OpenArabDictOtherWordParent)
{
    return <fragment>{RelationshipToText(relation.relationType, outgoing)} of <WordIdReferenceComponent wordId={relation.wordId} /></fragment>;
}

function RenderVerbDerivationData(verbData: OpenArabDictWordVerbParent)
{
    function DerivationText()
    {
        switch(verbData.derivation)
        {
            case OpenArabDictVerbDerivationType.ActiveParticiple:
                return "active participle of ";
            case OpenArabDictVerbDerivationType.PassiveParticiple:
                return "passive participle of ";
            case OpenArabDictVerbDerivationType.Colloquial:
                return "colloquial version of ";
            case OpenArabDictVerbDerivationType.MeaningRelated:
                return "related in meaning of ";
            case OpenArabDictVerbDerivationType.NounOfPlace:
                return "noun of place of ";
            case OpenArabDictVerbDerivationType.VerbalNoun:
                return "verbal noun of ";
        }
    }

    return <>
        {DerivationText()} <WordIdReferenceComponent wordId={verbData.verbId} />
    </>;
}

export function WordDerivationComponent(input: { parent?: OpenArabDictWordParent; })
{
    if(input.parent === undefined)
        return null;

    switch(input.parent.type)
    {
        case OpenArabDictWordParentType.NonVerbWord:
            return RenderDerivedTerm(true, input.parent);
        case OpenArabDictWordParentType.Root:
            return <RootIdReferenceComponent rootId={input.parent.rootId} />;
        case OpenArabDictWordParentType.Verb:
            return RenderVerbDerivationData(input.parent);
    }
}