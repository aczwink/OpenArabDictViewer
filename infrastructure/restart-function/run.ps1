param($eventGridEvent, $TriggerMetadata)

Write-Host "Event received: $($eventGridEvent.eventType) $($eventGridEvent.subject)"

Connect-AzAccount -Identity
Restart-AzWebApp -ResourceGroupName "openarabdict" -Name "openarabdictviewer-backend"

Write-Host "Triggered restart"