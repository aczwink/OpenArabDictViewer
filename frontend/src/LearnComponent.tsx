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

import { CheckBox, Component, FormField, I18n, Injectable, JSX_CreateElement, ProgressSpinner } from "@aczwink/acfrontend";
import { APIService } from "./services/APIService";
import { RenderTranslations } from "./shared/translations";
import { WordTypeToText } from "./shared/words";
import { CachedAPIService } from "./services/CachedAPIService";
import { RemoveTashkilButKeepShadda } from "@aczwink/openarabicconjugation/dist/Util";
import { GlobalSettingsService } from "./services/GlobalSettingsService";
import { FullWordData } from "../dist/api";

@Injectable
export class LearnComponent extends Component
{
    constructor(private apiService: APIService, private cachedAPIService: CachedAPIService, private globalSettingsService: GlobalSettingsService)
    {
        super();

        this.data = null;
        this.showTashkil = false;
        this.resolve = false;
    }
    
    protected Render()
    {
        if(this.data === null)
            return <ProgressSpinner />;

        const title = this.data.word.text;
        if(this.resolve)
        {
            return <div className="row justify-content-center text-center">
                <div className="col-auto">
                    <h1>{title}</h1>
                    <div className="row">
                        <div className="col">
                            { (this.data.translations.length > 0) ? RenderTranslations(this.data.translations) : this.RenderFunction(this.data)}
                        </div>
                    </div>
                    <button type="button" className="btn btn-primary" onclick={this.LoadNextWord.bind(this)}>{I18n("learn.next")}</button>
                </div>
            </div>;
        }

        const tashkilTitle = this.showTashkil ? title : RemoveTashkilButKeepShadda(title);

        return <div className="row justify-content-center text-center">
            <div className="col-auto">
                <h1>{tashkilTitle}</h1>
                <FormField title={I18n("learn.showTashkil")}>
                    <CheckBox value={this.showTashkil} onChanged={newValue => this.showTashkil = newValue} />
                </FormField>
                <button type="button" className="btn btn-primary" onclick={() => this.resolve = true}>{I18n("learn.resolve")}</button>
            </div>
        </div>;
    }

    //Private state
    private data: FullWordData | null;
    private showTashkil: boolean;
    private resolve: boolean;

    //Private methods
    private async LoadNextWord()
    {
        this.data = null;
        this.showTashkil = false;
        this.resolve = false;

        const response = await this.apiService.randomword.get({ translationLanguage: this.globalSettingsService.activeLanguage });
        const wordId = response.data;

        const word = await this.cachedAPIService.QueryFullWord(wordId);
        this.data = word;
    }

    private RenderFunction(func: FullWordData)
    {
        return <fragment>
            <h4>{WordTypeToText(func.word.type)}</h4>
            {RenderTranslations(func.translations)}
        </fragment>;
    }

    //Event handlers
    override OnInitiated(): void
    {
        this.LoadNextWord();
    }
}