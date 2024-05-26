/**
 * ArabDict
 * Copyright (C) 2024 Amir Czwink (amir130@hotmail.de)
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
import { ConjugationParams, DeclensionParams, Gender, Letter, Mood, Numerus, Person, Stem1Context, Tashkil, Tense, VoiceString } from "../../Definitions";
import { DialectConjugator } from "../../DialectConjugator";
import { RootType, VerbRoot } from "../../VerbRoot";
import { ConjugationVocalized, DisplayVocalized } from "../../Vocalization";
import { AugmentedRoot, AugmentedRootSymbolInput, SymbolName } from "../msa/AugmentedRoot";
import { Stem1Defective_DeriveRootTashkil } from "./stem1_defective";
import { Stem1Sound_DeriveRootTashkil as Sound_DeriveRootTashkil } from "./sound";
import { DerivePrefix } from "./prefix";

//Source is mostly: https://en.wikipedia.org/wiki/Levantine_Arabic_grammar

export class LebaneseConjugator implements DialectConjugator
{
    //Public methods    
    public Conjugate(root: VerbRoot, params: ConjugationParams): ConjugationVocalized[]
    {
        const rootAugmentation = this.AugmentRoot(root, params);
        if(rootAugmentation === undefined)
        {
            return [
                {
                    letter: "TODO" as any,
                    tashkil: Tashkil.Dhamma
                }
            ];
        }
        const augmentedRoot = new AugmentedRoot(rootAugmentation, root);

        const rootTashkil = this.DeriveRootTashkil(root, params);

        augmentedRoot.ApplyRadicalTashkil(1, rootTashkil.r1);
        augmentedRoot.ApplyRadicalTashkil(2, rootTashkil.r2);
        augmentedRoot.ApplyRadicalTashkil(3, rootTashkil.r3);

        this.ApplyEmphasis(augmentedRoot, params);

        const prefix = DerivePrefix(params);
        const suffix = this.DeriveSuffix(params);

        switch(augmentedRoot.type)
        {
            case RootType.Defective:
                {
                    if( (params.stem === 1) && (params.tense === Tense.Present) )
                    {
                        if(
                            ( (params.numerus === Numerus.Singular) && (params.person === Person.Second) && (params.gender === Gender.Female) )
                            ||
                            ( (params.numerus === Numerus.Plural) && (params.person !== Person.First) )
                        )
                        {
                            augmentedRoot.DropRadial(3);
                        }
                    }
                }
                break;
        }

        return prefix.concat(augmentedRoot.symbols, suffix);
    }

    public ConjugateParticiple(root: VerbRoot, stem: number, voice: VoiceString, stem1Context?: Stem1Context | undefined): ConjugationVocalized[]
    {
        switch(root.type)
        {
            case RootType.Hollow:
            {
                if((stem === 1) && (voice === "active"))
                {
                    return [
                        { letter: root.r1, tashkil: Tashkil.Fatha },
                        { letter: Letter.Alef, tashkil: Tashkil.LongVowelMarker },
                        { letter: Letter.Ya, tashkil: Tashkil.Kasra },
                        { letter: root.r3, tashkil: Tashkil.EndOfWordMarker },
                    ];
                }
            }
            break;
        }
        return [
            {
                letter: `T${Tashkil.Fatha}O${Tashkil.Fatha}D${Tashkil.Fatha}O` as any,
                tashkil: Tashkil.Fatha
            }
        ];
    }

    public DeclineAdjective(vocalized: DisplayVocalized[], params: DeclensionParams): DisplayVocalized[]
    {
        return [{ emphasis: true, letter: "TODO" as any, shadda: true, }];
    }

    public GenerateAllPossibleVerbalNouns(root: VerbRoot, stem: number): string[]
    {
        return [
            "TODO"
        ];
    }

    //Private methods
    private ApplyEmphasis(augmentedRoot: AugmentedRoot, params: ConjugationParams)
    {
        if(!(augmentedRoot.type === RootType.Sound))
            return;

        if(params.tense === Tense.Perfect)
        {
            if(params.person === Person.Third)
            {
                augmentedRoot.r1.emphasis = true;
            }
            else
            {
                augmentedRoot.r2.emphasis = true;
            }
        }
    }

    private AugmentRoot(root: VerbRoot, params: ConjugationParams): AugmentedRootSymbolInput[] | undefined
    {
        switch(params.stem)
        {
            case 1:
                switch(root.type)
                {
                    case RootType.Defective:
                        return [
                            {
                                symbolName: SymbolName.R1,
                            },
                            {
                                symbolName: SymbolName.R2,
                            },
                            {
                                symbolName: SymbolName.R3,
                            }
                        ];

                    case RootType.Sound:
                        if( (params.tense === Tense.Present) && (params.mood === Mood.Imperative) && (params.gender === Gender.Male) && (params.numerus === Numerus.Singular) )
                            {
                                return [
                                    {
                                        symbolName: SymbolName.R1,
                                    },
                                    {
                                        symbolName: SymbolName.R2,
                                    },
                                    {
                                        letter: Letter.Waw,
                                        symbolName: SymbolName.Infix,
                                        tashkil: Tashkil.LongVowelMarker
                                    },
                                    {
                                        symbolName: SymbolName.R3,
                                    }
                                ];
                            }
                            
                        return [
                            {
                                symbolName: SymbolName.R1,
                            },
                            {
                                symbolName: SymbolName.R2,
                            },
                            {
                                symbolName: SymbolName.R3,
                            }
                        ];
                }

            case 2:
            {
                switch(root.type)
                {
                    case RootType.Sound:
                        return [
                            { symbolName: SymbolName.R1 },
                            { symbolName: SymbolName.Infix, letter: root.r2, tashkil: Tashkil.Sukun },
                            { symbolName: SymbolName.R2 },
                            { symbolName: SymbolName.R3 },
                        ];
                }
            }
        }
        return undefined;
    }

    private DeriveRootTashkil(root: VerbRoot, params: ConjugationParams): { r1: Tashkil; r2: Tashkil; r3: Tashkil; }
    {
        switch(params.stem)
        {
            case 1:
            case 2:
                switch(root.type)
                {
                    case RootType.Defective:
                        return Stem1Defective_DeriveRootTashkil(params);
                    case RootType.Sound:
                        return Sound_DeriveRootTashkil(params);
                }
        }
        throw new Error("TODO: not implemented");
    }

    private DeriveSuffix(params: ConjugationParams): ConjugationVocalized[]
    {
        if(params.tense === Tense.Present)
            return this.DeriveSuffixPresent(params);

        if(params.numerus === Numerus.Plural)
        {
            switch(params.person)
            {
                case Person.First:
                    return [
                        {
                            letter: Letter.Nun,
                            tashkil: Tashkil.Fatha
                        },
                        {
                            letter: Letter.Alef,
                            tashkil: Tashkil.LongVowelMarker
                        }
                    ];

                case Person.Second:
                    return [
                        {
                            letter: Letter.Ta,
                            tashkil: Tashkil.Dhamma
                        },
                        {
                            letter: Letter.Waw,
                            tashkil: Tashkil.LongVowelMarker
                        },
                        {
                            letter: Letter.Alef,
                            tashkil: Tashkil.EndOfWordMarker
                        }
                    ];

                case Person.Third:
                    return [
                        {
                            letter: Letter.Waw,
                            tashkil: Tashkil.LongVowelMarker
                        },
                        {
                            letter: Letter.Alef,
                            tashkil: Tashkil.EndOfWordMarker
                        }
                    ];
            }
        }

        switch(params.person)
        {
            case Person.First:
                return [
                    {
                        letter: Letter.Ta,
                        tashkil: Tashkil.Sukun
                    }
                ];
                    
            case Person.Second:
                if(params.gender === Gender.Male)
                    return [
                        {
                            letter: Letter.Ta,
                            tashkil: Tashkil.Sukun
                        }
                    ];

                return [
                    {
                        letter: Letter.Ta,
                        tashkil: Tashkil.Kasra
                    },
                    {
                        letter: Letter.Ya,
                        tashkil: Tashkil.LongVowelMarker
                    }
                ];
                
            case Person.Third:
                if(params.gender === Gender.Male)
                    return [];

                return [
                    {
                        letter: Letter.Ta,
                        tashkil: Tashkil.Sukun
                    }
                ];
        }
    }

    private DeriveSuffixPresent(params: ConjugationParams): ConjugationVocalized[]
    {
        if(params.numerus === Numerus.Plural)
        {
            switch(params.person)
            {
                case Person.Second:
                case Person.Third:
                    return [
                        {
                            letter: Letter.Waw,
                            tashkil: Tashkil.LongVowelMarker
                        },
                        {
                            letter: Letter.Alef,
                            tashkil: Tashkil.EndOfWordMarker
                        }
                    ];
            }
        }
        else
        {
            if((params.person === Person.Second) && (params.gender === Gender.Female))
            {
                return [
                    {
                        letter: Letter.Ya,
                        tashkil: Tashkil.LongVowelMarker
                    }
                ];
            }
        }

        return [];
    }
}