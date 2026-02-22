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

import { OpenArabDictGenderedWord, OpenArabDictWordRelationshipType, OpenArabDictWordType } from "@aczwink/openarabdict-domain";
import { OpenArabDictNonVerbDerivationType, OpenArabDictWord } from "../../dist/api";
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

export function WordDerivationTypeFromWordToString(type: OpenArabDictNonVerbDerivationType): string
{
    switch(type)
    {
        case OpenArabDictNonVerbDerivationType.AdverbialAccusative:
            return "adverbial accusative";
        case OpenArabDictNonVerbDerivationType.Feminine:
            return "feminine version";
        case OpenArabDictNonVerbDerivationType.Plural:
            return "plural";
        case OpenArabDictNonVerbDerivationType.InstanceNoun:
            return "instance noun";
        case OpenArabDictNonVerbDerivationType.Nisba:
            return "relative adjective (nisbah اَلنِّسْبَة)";
        case OpenArabDictNonVerbDerivationType.Colloquial:
            return "colloquial version";
        case OpenArabDictNonVerbDerivationType.Extension:
            return "extension";
        case OpenArabDictNonVerbDerivationType.ElativeDegree:
            return "elative degree";
        case OpenArabDictNonVerbDerivationType.Singulative:
            return "singulative";
        case OpenArabDictNonVerbDerivationType.DefinitiveState:
            return "definitive state";
    }
}

export function WordGenderToAbbreviation(isMale: boolean | null)
{
    if(isMale === true)
        return "m";
    else if(isMale === false)
        return "f";
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
            return "Conjunction";
        case OpenArabDictWordType.ForeignVerb:
            return "Foreign Verb";
        case OpenArabDictWordType.Adverb:
            return "adverb";
        case OpenArabDictWordType.Pronoun:
            return "Pronoun";
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