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

import { Component, Injectable, JSX_CreateElement, ProgressSpinner } from "acfrontend";
import { APIService } from "./services/APIService";
import { DialectStatistics, DictionaryStatistics, VerbalNounFrequencies, VerbType } from "../dist/api";
import { DialectsService } from "./services/DialectsService";
import { Dictionary, KeyValuePair, ObjectExtensions } from "acts-util-core";
import { ConjugationService } from "./services/ConjugationService";
import { RomanNumberComponent, StemNumberComponent } from "./shared/RomanNumberComponent";
import { DialectType } from "openarabicconjugation/src/Dialects";
import { ConjugationSchemeToString } from "./verbs/ToStringStuff";
import { AdvancedStemNumber } from "openarabicconjugation/src/Definitions";
import { VerbConjugationService } from "./services/VerbConjugationService";

@Injectable
export class StatisticsComponent extends Component
{
    constructor(private apiService: APIService, private dialectsService: DialectsService, private conjugationService: ConjugationService, private verbConjugationService: VerbConjugationService)
    {
        super();

        this.data = null;
    }

    protected Render(): RenderValue
    {
        if(this.data === null)
            return <ProgressSpinner />;

        return <div className="container">
            <h3>Ingested data</h3>
            {this.RenderColumnTable("General", this.RenderGeneralStatsTable())}

            {this.RenderKeyValueTable("Translations per dialect", {
                dialect: "Dialect",
                wordsCount: "Words",
            }, this.data.dialectCounts.map(this.BuildDialectRows.bind(this)))}

            <h3>Data analysis</h3>

            {this.RenderKeyValueTable("Verbs per type", {
                rootType: "Verb type",
                count: "Count"
            }, this.data.verbTypeCounts.map(x => ({
                ...x,
                rootType: ConjugationSchemeToString(x.scheme),
            })))}

            {this.RenderKeyValueTable("Verbs per Stem", {
                stem: "Stem",
                count: "Count"
            }, this.data.stemCounts.map(x => ({
                stem: <RomanNumberComponent num={x.stem} />,
                count: x.count
            })))}
            
            {this.RenderKeyValueTable("Stem 1 frequencies", {
                dialect: "Dialect",
                verbType: "Verb type",
                form: "Form",
                count: "Count"
            }, this.data.stem1Freq.map(x => ({
                dialect: this.DialectToString(x.dialectId),
                verbType: ConjugationSchemeToString(x.scheme),
                form: this.BuildForm(x.scheme, x.stemParameters, x.dialectId),
                count: x.count,
            })))}
            
            {this.RenderKeyValueTable("Verbal noun frequencies", {
                verbType: "Verb type",
                stem: "Stem",
                form: "Form",
                verbalNoun: "Verbal noun",
                count: "Count",
                likelihood: "Likelihood"
            }, this.data.verbalNounFreq.map(x => ({
                verbType: ConjugationSchemeToString(x.scheme),
                stem: <StemNumberComponent verbType={x.scheme} stem={x.stem} />,
                form: (x.stemParameters === undefined) ? "" : this.BuildForm(x.scheme, x.stemParameters, this.dialectsService.FindDialect(DialectType.ModernStandardArabic)!.id),
                verbalNoun: this.GenerateVerbalNoun(x.scheme, x.stem, x.stemParameters, x.verbalNounIndex),
                count: x.count,
                likelihood: this.ComputeVerbalNounLikelihood(x, this.data!.verbalNounFreq)
            })))}
        </div>;
    }

    //Private state
    private data: DictionaryStatistics | null;

    //Private methods
    private BuildDialectRows(dialectCounts: DialectStatistics)
    {
        return {
            dialect: this.DialectToString(dialectCounts.dialectId),
            wordsCount: dialectCounts.wordsCount,
        };
    }

    private BuildForm(scheme: VerbType, stemParameters: string, dialectId: number)
    {
        const radicals = this.GetExampleRootRadicals(scheme);
        return this.verbConjugationService.CreateDefaultDisplayVersionOfVerb(radicals.join(""), {
            stem: 1,
            variants: [
                {
                    dialectId,
                    stemParameters
                }
            ]
        });
    }

    private ComputeVerbalNounLikelihood(freq: VerbalNounFrequencies, total: VerbalNounFrequencies[])
    {
        const allMatching = total.Values().Filter(x => (x.scheme === freq.scheme) && (x.stem === freq.stem) && (x.stemParameters === freq.stemParameters)).Map(x => x.count).Sum();

        const p = Math.round(freq.count * 100 / allMatching);
        return p + "%";
    }

    private DialectToString(dialectId: number)
    {
        const d = this.dialectsService.GetDialect(dialectId);
        return d.emojiCodes + " " + d.name;
    }

    private GenerateVerbalNoun(scheme: VerbType, stem: number, stemParameters: string | undefined, verbalNounIndex: number)
    {
        const radicals = this.GetExampleRootRadicals(scheme).join("");
        const stemData: AdvancedStemNumber | string = (stemParameters === undefined) ? (stem as AdvancedStemNumber) : stemParameters;

        const generated = this.conjugationService.GenerateAllPossibleVerbalNouns(radicals, stemData)[verbalNounIndex];
        return generated;
    }

    private GetExampleRootRadicals(scheme: VerbType)
    {
        switch(scheme)
        {
            case VerbType.Assimilated:
                return ["و", "ع", "ل"];
            case VerbType.AssimilatedAndDefective:
                return ["و", "ع", "ي"];
            case VerbType.Defective:
                return ["ف", "ع", "و"];
            case VerbType.Geminate:
                return ["ف", "ل", "ل"];
            case VerbType.HamzaOnR1:
                return ["ء", "ع", "ل"];
            case VerbType.Hollow:
                return ["ف", "و", "ل"];
            case VerbType.Irregular:
                return [];
            case VerbType.QuadriliteralAndDefective:
                return ["ف", "ع", "ل", "ي"];
            case VerbType.Sound:
                return ["ف", "ع", "ل"];
            case VerbType.SoundQuadriliteral:
                return ["ف", "ع", "ل", "ق"];
        }
    }

    private RenderColumnTable(heading: string, rows: any[])
    {
        return this.RenderTableWithHeading(heading, [], rows, true);
    }

    private RenderKeyValueTable(heading: string, headings: Dictionary<string>, values: any[])
    {
        const header = <fragment>
            <tr>
                {ObjectExtensions.Values(headings).Map(x => <th>{x}</th>).ToArray()}
            </tr>
        </fragment>;
        const rows = <fragment>
            {values.map(row => <tr>
                {ObjectExtensions.OwnKeys(headings).Map(x => <td>{row[x]}</td>).ToArray()}
            </tr>)}
        </fragment>;
        return this.RenderTableWithHeading(heading, header, rows, false);
    }

    private RenderGeneralStatsTable()
    {
        return <fragment>
            <tr>
                <th>Number of roots:</th>
                <td>{this.data!.rootsCount}</td>
            </tr>
            <tr>
                <th>Number of words:</th>
                <td>{this.data!.wordsCount}</td>
            </tr>
        </fragment>;
    }

    private RenderTableWithHeading(heading: string, head: any, rows: any[], columnCentric: boolean)
    {
        const className = columnCentric ? "table-striped-columns" : "table-striped";
        return <fragment>
            <h4>{heading}</h4>
            <table className={"table table-bordered table-sm " + className}>
                <thead>{head}</thead>
                <tbody>{rows}</tbody>
            </table>
        </fragment>;
    }

    //Event handlers
    override async OnInitiated(): Promise<void>
    {
        function FilterComplex(kv: KeyValuePair<VerbType, VerbalNounFrequencies[]>)
        {
            const byStem = kv.value.Values().GroupBy(x => x.stem);
            const filtered = byStem.Filter(x => (x.value.length > 1) || (x.value[0].verbalNounIndex === -1));

            return filtered.Map(x => x.value.Values()).Flatten();
        }

        const response = await this.apiService.statistics.get();
        this.data = response.data;
        this.data.dialectCounts.SortByDescending(x => x.wordsCount);
        this.data.verbTypeCounts.SortByDescending(x => x.count);
        this.data.stemCounts.SortByDescending(x => x.count);

        this.data.stem1Freq.SortByDescending(x => x.count);
        this.data.stem1Freq = this.data.stem1Freq.Values().GroupBy(x => x.scheme)
            .Filter(x => x.value.length > 1)
            .Map(x => x.value.Values().OrderByDescending(x => x.count)).Flatten().ToArray();

        this.data.verbalNounFreq = this.data.verbalNounFreq.Values().GroupBy(x => x.scheme)
            .Map(FilterComplex)
            .Map(x => x.OrderBy(x => [x.stem, x.count])).Flatten().ToArray();
    }
}