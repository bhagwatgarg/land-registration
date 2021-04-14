rm -rf identity
cd ../..
./network-clean.sh
./network-starter.sh
cd organization/digibank/
source digibank.sh
peer lifecycle chaincode package cp.tar.gz --lang node --path ./contract --label cp_0
peer lifecycle chaincode install cp.tar.gz
export PACKAGE_ID=$(peer lifecycle chaincode queryinstalled --output json | jq -r '.installed_chaincodes[0].package_id')
peer lifecycle chaincode approveformyorg  --orderer localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
                                          --channelID mychannel  \
                                          --name propertycontract  \
                                          -v 0  \
                                          --package-id $PACKAGE_ID \
                                          --sequence 1  \
                                          --tls  \
                                          --cafile "$ORDERER_CA"
peer lifecycle chaincode checkcommitreadiness --channelID mychannel --name propertycontract -v 0 --sequence 1
cd ../magnetocorp/
./mag-install_contract.sh
cd ../digibank/application/
./enroll.sh
