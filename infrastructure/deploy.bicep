param location string = resourceGroup().location
param servicePrincipalObjectId string

resource frontend 'Microsoft.Web/staticSites@2023-12-01' = {
  name: 'openarabdictviewer-frontend'
  location: location

  properties: {
  }
  sku: {
    name: 'Free'
  }
}

resource appServicePlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: 'openarabdictviewer-asp'
  location: location

  kind: 'linux'
  properties: {
    reserved: true
  }
  sku: {
    name: 'B1'
  }
}

resource backend 'Microsoft.Web/sites@2024-04-01' = {
  name: 'openarabdictviewer-backend'
  location: location

  properties: {
    httpsOnly: true
    serverFarmId: appServicePlan.id
    
    siteConfig: {
      appCommandLine: './bundle.js'

      appSettings: [
        {
          name: 'ARABDICT_DICTDB_PATH'
          value: '/srv/db/db.json'
        }
        {
          name: 'ARABDICT_ORIGIN'
          value: 'https://${frontend.properties.defaultHostname}'
        }
        {
          name: 'ARABDICT_PORT'
          value: '8080'
        }
      ]

      linuxFxVersion: 'NODE|18-lts'
      minTlsVersion: '1.3'
    }
  }
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'openarabdictdbstorage'
  location: location

  kind: 'StorageV2'
  properties: {
    allowSharedKeyAccess: true //required for mounting
  }
  sku: {
    name: 'Standard_LRS'
  }
}

resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource dbContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: 'dbstorage'
}

resource storageSetting 'Microsoft.Web/sites/config@2021-01-15' = {
  name: 'azurestorageaccounts'
  parent: backend
  properties: {
    dbstorage: {
      type: 'AzureBlob'
      accountName: storageAccount.name
      shareName: dbContainer.name
      mountPath: '/srv/db'
      accessKey: storageAccount.listKeys().keys[0].value
    }
  }
}

var storageBlobDataContributorRoleDefinitionId = '/providers/Microsoft.Authorization/roleDefinitions/ba92f5b4-2d11-453d-a403-e96b0029c9fe'
resource storageBlobContributorRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: dbContainer
  name: guid(storageAccount.id, dbContainer.id, servicePrincipalObjectId, storageBlobDataContributorRoleDefinitionId)
  properties: {
    roleDefinitionId: storageBlobDataContributorRoleDefinitionId
    principalId: servicePrincipalObjectId
    principalType: 'ServicePrincipal'
  }
}

var contributorRoleDefinitionId = '/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c'
resource appServiceContributorRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: backend
  name: guid(backend.id, servicePrincipalObjectId, contributorRoleDefinitionId)
  properties: {
    roleDefinitionId: contributorRoleDefinitionId
    principalId: servicePrincipalObjectId
    principalType: 'ServicePrincipal'
  }
}