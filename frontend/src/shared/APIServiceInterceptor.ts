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

import { Injectable, HTTPInterceptor, InfoMessageManager } from "@aczwink/acfrontend";
import { ResponseData } from "@aczwink/acfrontend/dist/Services/HTTPService";

@Injectable
export class APIServiceInterceptor implements HTTPInterceptor
{
    constructor(private infoMessageManager: InfoMessageManager)
    {
    }

    public async Intercept(response: ResponseData): Promise<boolean>
    {
        switch(response.statusCode)
        {
            case 400:
            {
                const message = `
                Unhandled error: ${response.statusCode}
                ${response.body}
                `;

                this.infoMessageManager.ShowMessage(message, {
                    type: "danger",
                    duration: 10000
                });
            }
            break;
        }

        return true;
    }
}