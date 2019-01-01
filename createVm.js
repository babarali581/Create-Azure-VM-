const msrest = require("ms-rest");
const msRestAzure = require("ms-rest-azure");
const AzureServiceClient = msRestAzure.AzureServiceClient;
const ComputeManagementClient = require("azure-arm-compute");
const NetworkManagementClient = require('azure-arm-network');

const clientId = "" /* enter clientId/appID/ */ 
const secret = "" /* enter secretKey/ */ 
const domain = "" /* enterdomain */ //also known as tenantId
const subscriptionId =""/* enter sub Id */// ;
var client;

//an example to list resource groups in a subscription
msRestAzure
  .loginWithServicePrincipalSecret(clientId, secret, domain)
  .then(credentials => {
    //client = new AzureServiceClient(creds);

    let adminPass = "Babbbbbbbbbbbbbbbbbbbbbbbbbb!";
    const networkClient = new NetworkManagementClient(
      credentials,
      subscriptionId
    );
    const computeClient = new ComputeManagementClient(
      credentials,
      subscriptionId
    );

    let nicParameters = {
      location: "eastus",
      ipConfigurations: [
        {
          name: "vmnetinterface",
          privateIPAllocationMethod: "Dynamic"
        }
      ]
    };

    const vnetParameters = {
      location: "eastus",
      addressSpace: {
        addressPrefixes: ["10.0.0.0/16"]
      },
      dhcpOptions: {
        dnsServers: ["10.1.1.1", "10.1.2.4"]
      },
      subnets: [{ name: "mynodesubnet", addressPrefix: "10.0.0.0/24" }]
    };

    let vmParameters = {
      location: "eastus",
      osProfile: {
        computerName: "newLinuxVM",
        adminUsername: "testadmin",
        adminPassword: "Babbbbbbbbbbbbbbbbbbbbbbbbbb!"
      },
      hardwareProfile: {
        vmSize: "Basic_A1"
      },
      networkProfile: {
        networkInterfaces: [
          {
            primary: true
          }
        ]
      },
      storageProfile: {
        imageReference: {
          publisher: "Canonical",
          offer: "UbuntuServer",
          sku: "16.04-LTS",
          version: "latest"
        }
      }
    };

    let publicIPParameters = {
      location: "eastus",
      publicIPAllocationMethod: "Dynamic"
    };

    networkClient.virtualNetworks
      .createOrUpdate("enterresourcegtoup", "mynodevnet", vnetParameters)
      .then(function(vnetwork) {
       // console.log("vnetwork ",vnetwork)
        networkClient.subnets
          .get("enterresourcegtoup", "mynodevnet", "mynodesubnet")
          .then(function(subnetInfo) {
            nicParameters.ipConfigurations[0].subnet = subnetInfo;
            networkClient.publicIPAddresses
              .createOrUpdate(
                "enterresourcegtoup",
                "myLinuxPublicIP",
                publicIPParameters
              )
              .then(function(publicIP) {
                nicParameters.ipConfigurations[0].publicIPAddress = publicIP;
                networkClient.networkInterfaces
                  .createOrUpdate(
                    "enterresourcegtoup",
                    "vmnetinterface",
                    nicParameters
                  )
                  .then(function(vmNetworkInterface) {
                    vmParameters.networkProfile.networkInterfaces[0].id =
                      vmNetworkInterface.id;
                    computeClient.virtualMachines.createOrUpdate(
                      "enterresourcegtoup",
                      "newLinuxVM",
                      vmParameters,
                      (err, data) => {
                        if (err) return console.log(err);
                        console.log("Created new Linux VM");
                      }
                    );
                  });
              });
          });
      });
  });
