provider "azurerm" {}

resource "azurerm_resource_group" "main" {
  name     = "${var.resource_group_name}"
  location = "${var.location}"
}

resource "azurerm_storage_account" "docker_storage" {
  name                     = "${var.docker_registry_name}"
  resource_group_name      = "${azurerm_resource_group.main.name}"
  location                 = "${azurerm_resource_group.main.location}"
  account_tier             = "Standard"
  account_replication_type = "GRS"
}

resource "azurerm_container_registry" "docker_registry" {
  name                = "nodejsmicroexample"
  resource_group_name = "${azurerm_resource_group.main.name}"
  location            = "${azurerm_resource_group.main.location}"
  admin_enabled       = true
  sku                 = "Classic"
  storage_account_id  = "${azurerm_storage_account.docker_storage.id}"
}
