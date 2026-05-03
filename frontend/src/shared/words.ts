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

import { OpenArabDictGender, OpenArabDictGendered, OpenArabDictLexeme, OpenArabDictParentType, OpenArabDictPartOfSpeech, OpenArabDictPOSType, OpenArabDictWordRelationshipType } from "@aczwink/openarabdict-domain";
import { I18n } from "@aczwink/acfrontend";

export const allWordTypes = [
    OpenArabDictPOSType.Adjective,
    OpenArabDictPOSType.Conjunction,
    OpenArabDictPOSType.ForeignVerb,
    OpenArabDictPOSType.Interjection,
    OpenArabDictPOSType.Noun,
    OpenArabDictPOSType.Preposition,
    OpenArabDictPOSType.Adverb,
    OpenArabDictPOSType.Pronoun,
    OpenArabDictPOSType.Phrase,
    OpenArabDictPOSType.Particle,
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
        case OpenArabDictParentType.ToolNoun:
            return "tool noun";
        case OpenArabDictParentType.CharacteristicNoun:
            return "characteristic noun";
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

function WordTypeMayHaveGender(wordType: OpenArabDictPOSType)
{
    switch(wordType)
    {
        case OpenArabDictPOSType.Adjective:
        case OpenArabDictPOSType.Noun:
        case OpenArabDictPOSType.Pronoun:
            return true;
    }

    return false;
}

export function WordMayHaveGender(word: OpenArabDictPartOfSpeech): word is OpenArabDictGendered
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

export function WordTypeToAbbreviationText(wordType: OpenArabDictPOSType)
{
    switch(wordType)
    {
        case OpenArabDictPOSType.Noun:
            return "";
        case OpenArabDictPOSType.Preposition:
            return "(prep.)";
        case OpenArabDictPOSType.Adjective:
            return "(adj.)";
        case OpenArabDictPOSType.Conjunction:
            return "(conj.)";
        case OpenArabDictPOSType.ForeignVerb:
            return "(foreign verb)";
        case OpenArabDictPOSType.Adverb:
            return "(adv.)";
        case OpenArabDictPOSType.Pronoun:
            return "(pronoun)";
        case OpenArabDictPOSType.Phrase:
            return "(phrase)";
        case OpenArabDictPOSType.Particle:
            return "(particle)";
        case OpenArabDictPOSType.Interjection:
            return "(interj.)";
        case OpenArabDictPOSType.Numeral:
            return "(numeral)";
        case OpenArabDictPOSType.Verb:
            return "(verb)";
    }
}

function WordTypeToDictionaryKey(wordType: OpenArabDictPOSType)
{
    switch(wordType)
    {
        case OpenArabDictPOSType.Noun:
            return "noun";
        case OpenArabDictPOSType.Preposition:
            return "preposition";
        case OpenArabDictPOSType.Adjective:
            return "adjective";
        case OpenArabDictPOSType.Conjunction:
            return "conjunction";
        case OpenArabDictPOSType.ForeignVerb:
            return "Foreign Verb";
        case OpenArabDictPOSType.Adverb:
            return "adverb";
        case OpenArabDictPOSType.Pronoun:
            return "pronoun";
        case OpenArabDictPOSType.Phrase:
            return "Phrase";
        case OpenArabDictPOSType.Particle:
            return "particle";
        case OpenArabDictPOSType.Interjection:
            return "Interjection";
        case OpenArabDictPOSType.Verb:
            return "Verb";
        case OpenArabDictPOSType.Numeral:
            return "numeral";
    }
}

export function WordTypeToText(wordType: OpenArabDictPOSType)
{
    return I18n("word.types." + WordTypeToDictionaryKey(wordType));
}