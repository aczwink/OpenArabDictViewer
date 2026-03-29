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

import { OpenArabDictGender, OpenArabDictGenderedWord, OpenArabDictParentType, OpenArabDictWordRelationshipType, OpenArabDictWordType } from "@aczwink/openarabdict-domain";
import { OpenArabDictWord } from "../../dist/api";
import { I18n } from "@aczwink/acfrontend";

export const allWordTypes = [
    OpenArabDictWordType.Adjective,
    OpenArabDictWordType.Conjunction,
    OpenArabDictWordType.ForeignVerb,
    OpenArabDictWordType.Interjection,
    OpenArabDictWordType.Noun,
    OpenArabDictWordType.Preposition,
    OpenArabDictWordType.Adverb,
    OpenArabDictWordType.Pronoun,
    OpenArabDictWordType.Phrase,
    OpenArabDictWordType.Particle,
];

export function WordDerivationTypeFromWordToString(type: OpenArabDictParentType): string
{
    switch(type)
    {
        case OpenArabDictParentType.ActiveParticiple:
            return "active participle";
        case OpenArabDictParentType.PassiveParticiple:
            return "passive participle";
        case OpenArabDictParentType.Colloquial:
            return "colloquial version";
        case OpenArabDictParentType.MeaningRelated:
            return "related in meaning";
        case OpenArabDictParentType.NounOfPlace:
            return "noun of place";
        case OpenArabDictParentType.VerbalNoun:
            return "verbal noun";
        case OpenArabDictParentType.AdverbialAccusative:
            return "adverbial accusative";
        case OpenArabDictParentType.Feminine:
            return "feminine version";
        case OpenArabDictParentType.Plural:
            return "plural";
        case OpenArabDictParentType.InstanceNoun:
            return "instance noun";
        case OpenArabDictParentType.Nisba:
            return "relative adjective (nisbah اَلنِّسْبَة)";
        case OpenArabDictParentType.Colloquial:
            return "colloquial version";
        case OpenArabDictParentType.Extension:
            return "extension";
        case OpenArabDictParentType.ElativeDegree:
            return "elative degree";
        case OpenArabDictParentType.Singulative:
            return "singulative";
        case OpenArabDictParentType.DefiniteState:
            return "definitive state";
        case OpenArabDictParentType.ComposedOf:
            return "composed";
        default:
            throw new Error("Unknown type: " + type);
    }
}

export function WordGenderToAbbreviation(gender: OpenArabDictGender | null)
{
    switch(gender)
    {
        case OpenArabDictGender.Female:
            return "f";
        case OpenArabDictGender.FemaleOrMale:
            return "f/m";
        case OpenArabDictGender.Male:
            return "m";
    }
    return "?";
}

function WordTypeMayHaveGender(wordType: OpenArabDictWordType)
{
    switch(wordType)
    {
        case OpenArabDictWordType.Adjective:
        case OpenArabDictWordType.Noun:
        case OpenArabDictWordType.Pronoun:
            return true;
    }

    return false;
}

export function WordMayHaveGender(word: OpenArabDictWord): word is OpenArabDictGenderedWord
{
    return WordTypeMayHaveGender(word.type);
}

export function WordRelationshipTypeToString(type: OpenArabDictWordRelationshipType)
{
    switch(type)
    {
        case OpenArabDictWordRelationshipType.Antonym:
            return "antonym";
        case OpenArabDictWordRelationshipType.EqualSpelling:
            return "exact spelling";
        case OpenArabDictWordRelationshipType.Synonym:
            return "synonym";
    }
}

export function WordTypeToAbbreviationText(wordType: OpenArabDictWordType)
{
    switch(wordType)
    {
        case OpenArabDictWordType.Noun:
            return "";
        case OpenArabDictWordType.Preposition:
            return "(prep.)";
        case OpenArabDictWordType.Adjective:
            return "(adj.)";
        case OpenArabDictWordType.Conjunction:
            return "(conj.)";
        case OpenArabDictWordType.ForeignVerb:
            return "(foreign verb)";
        case OpenArabDictWordType.Adverb:
            return "(adv.)";
        case OpenArabDictWordType.Pronoun:
            return "(pronoun)";
        case OpenArabDictWordType.Phrase:
            return "(phrase)";
        case OpenArabDictWordType.Particle:
            return "(particle)";
        case OpenArabDictWordType.Interjection:
            return "(interj.)";
        case OpenArabDictWordType.Numeral:
            return "(numeral)";
        case OpenArabDictWordType.Verb:
            return "(verb)";
    }
}

function WordTypeToDictionaryKey(wordType: OpenArabDictWordType)
{
    switch(wordType)
    {
        case OpenArabDictWordType.Noun:
            return "noun";
        case OpenArabDictWordType.Preposition:
            return "preposition";
        case OpenArabDictWordType.Adjective:
            return "adjective";
        case OpenArabDictWordType.Conjunction:
            return "conjunction";
        case OpenArabDictWordType.ForeignVerb:
            return "Foreign Verb";
        case OpenArabDictWordType.Adverb:
            return "adverb";
        case OpenArabDictWordType.Pronoun:
            return "pronoun";
        case OpenArabDictWordType.Phrase:
            return "Phrase";
        case OpenArabDictWordType.Particle:
            return "particle";
        case OpenArabDictWordType.Interjection:
            return "Interjection";
        case OpenArabDictWordType.Verb:
            return "Verb";
        case OpenArabDictWordType.Numeral:
            return "Numeral";
    }
}

export function WordTypeToText(wordType: OpenArabDictWordType)
{
    return I18n("word.types." + WordTypeToDictionaryKey(wordType));
}