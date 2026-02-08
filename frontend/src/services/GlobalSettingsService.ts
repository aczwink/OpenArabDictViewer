/**
 * OpenArabDictViewer
 * Copyright (C) 2025-2026 Amir Czwink (amir130@hotmail.de)
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

import { I18nManager, Injectable } from "@aczwink/acfrontend";
import { TranslationLanguage } from "../../dist/api";
import { DialectType } from "@aczwink/openarabicconjugation";

@Injectable
export class GlobalSettingsService
{
    constructor(private i18nManager: I18nManager)
    {
        this._dialectType = DialectType.ModernStandardArabic;
    }

    //Properties
    public get activeLanguage()
    {
        return this.i18nManager.activeLanguage as TranslationLanguage;
    }

    public set activeLanguage(newValue: TranslationLanguage)
    {
        this.i18nManager.activeLanguage = newValue;
    }

    public get dialectType()
    {
        return this._dialectType;
    }

    public set dialectType(dialectType: DialectType)
    {
        this._dialectType = dialectType;
    }

    //Public methods
    public async LoadLanguages()
    {    
        this.i18nManager.AddLanguage("en", await import("../../dist/en.json"));
        this.i18nManager.activeLanguage = "en";

        this.i18nManager.AddLanguage("de", await import("../../dist/de.json"), "en");
    }

    //State
    private _dialectType: DialectType;
}