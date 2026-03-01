param backendResourceName string
param location string

resource funcASP 'Microsoft.Web/serverfarms@2025-03-01' = {
  name: 'openarabdictviewer-function-asp'
  location: location

  properties: {
    reserved: false
  }
  sku: {
    name: 'Y1'
  }
}

resource functionAppStorage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'openarabdictfuncstorage'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
  }
}

resource funcApp 'Microsoft.Web/sites@2025-03-01' = {
  name: 'openarabdictviewer-restart-functionapp'
  location: location
  kind: 'functionapp'

  identity: {
    type: 'SystemAssigned'
  }

  properties: {
    serverFarmId: funcASP.id

    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${functionAppStorage.name};AccountKey=${functionAppStorage.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'powershell'
        }
      ]
      powerShellVersion: '7.4'
    }
  }
}

resource restartFunc 'Microsoft.Web/sites/functions@2025-03-01' = {
  name: 'restart-backend-function'
  parent: funcApp

  properties: {
    config: {
      bindings: [
        {
            type: 'eventGridTrigger'
            name: 'eventGridEvent'
            direction: 'in'
        }
      ]
    }
    files: {
      '../host.json': loadTextContent('./host.json')
      '../requirements.psd1': loadTextContent('./requirements.psd1')
      'run.ps1': loadTextContent('./run.ps1')
    }
  }
}

resource openArabDictDbStorageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' existing = {
  name: 'openarabdictdbstorage'
}

resource eventGridSubscription 'Microsoft.EventGrid/eventSubscriptions@2025-02-15' = {
  name: 'restart-backend-on-dictionary-change'
  scope: openArabDictDbStorageAccount

  properties: {
    destination: {
      endpointType: 'AzureFunction'
      properties: {
        resourceId: restartFunc.id
      }
    }
    filter: {
      includedEventTypes: [
        'Microsoft.Storage.BlobCreated'
      ]
    }
  }
}

var websiteContributorRoleDefId = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  'de139f84-1756-47ae-9be6-808fbbe84772'
)

resource backend 'Microsoft.Web/sites@2024-04-01' existing = {
  name: backendResourceName
}

resource funcAppWebsiteContributorRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(restartFunc.id, 'funcApp-website-contributor')
  scope: backend
  properties: {
    roleDefinitionId: websiteContributorRoleDefId
    principalId: funcApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}
