rm -rf identity
source magnetocorp.sh
cp ../digibank/cp.tar.gz cp.tar.gz
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
peer lifecycle chaincode commit -o localhost:7050 \
                                --peerAddresses localhost:7051 --tlsRootCertFiles "${PEER0_ORG1_CA}" \
                                --peerAddresses localhost:9051 --tlsRootCertFiles "${PEER0_ORG2_CA}" \
                                --ordererTLSHostnameOverride orderer.example.com \
                                --channelID mychannel --name propertycontract -v 0 \
                                --sequence 1 \
                                --tls --cafile "$ORDERER_CA" --waitForEvent
