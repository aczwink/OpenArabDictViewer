param location string = resourceGroup().location
param servicePrincipalObjectId string

module app './app.bicep' = {
  params: {
    location: location
    servicePrincipalObjectId: servicePrincipalObjectId
  }
}

module restartFunction './restart-function/module.bicep' = {
  params: {
    backendResourceName: app.outputs.backendName
    location: location
  }
}
