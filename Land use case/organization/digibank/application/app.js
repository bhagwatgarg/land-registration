const yargs = require('yargs');
const fs = require('fs');
const yaml = require('js-yaml');
const { Wallets, Gateway } = require('fabric-network');
const Property = require('../../digibank/contract/lib/property.js');
const PropertyRequest = require('../../digibank/contract/lib/propertyrequest.js');

const argv = yargs
    .option('transaction', {
      alias: 't',
      description: 'The transaction to execute',
      type: 'string',
      demandOption: true
    })
    .option('user', {
      alias: 'u',
      description: 'the user who initiates the transaction',
      type: 'string',
      demandOption: true
    })
    .help()
    .alias('help', 'h')
    .argv;

const nameSpaces={
  property: 'org.land-reg.property',
  propertyRequest: 'org.land-reg.propertyrequest',
};

const propertyPrinter = (buff)=>{
  buff=Property.fromBuffer(buff);
  console.log({propertyID: buff.propertyID, owner: buff.owner, address: buff.address, propertyState: buff.currentState});
};
const propertyRequestPrinter = (buff) => {
  buff=PropertyRequest.fromBuffer(buff);
  console.log({propertyID: buff.propertyID, requestID: buff.requestID, buyer: buff.buyer, amount: buff.amount, requestState: buff.currentState});
};
const listPrinter = (buff) => {
  console.log(JSON.parse(buff.toString()).map((res)=>{
   res=res.Record;
   let res2={
     address: res.address,
     owner: res.owner,
     propertyID: res.propertyID,
   };
   return res2;
 }));
};

const user_transaction={
  manager: {
    MakePayment: {
      nameSpace: nameSpaces.propertyRequest,
      args: 2,
      argsInfo: "RequestID, buyer",
      func: propertyRequestPrinter,
    },
    issue: {
      nameSpace: nameSpaces.property,
      args: 3,
      argsInfo: "propertyID, owner, address",
      func: propertyPrinter,
    },
   Reject: {
      nameSpace: nameSpaces.propertyRequest,
      args: 2,
      argsInfo: "RequestID, buyer",
      func: propertyRequestPrinter,
    },

  },
  buyer: {
    getList: {
      nameSpace: nameSpaces.property,
      args: 0,
      argsInfo: "",
      func: listPrinter,
    },
    initiate: {
      nameSpace: nameSpaces.propertyRequest,
      args: 4,
      argsInfo: "PropertyID, RequestID, buyer, amount",
      func: propertyRequestPrinter,
    },
    FinalizeProperty: {
      nameSpace: nameSpaces.propertyRequest,
      args: 2,
      argsInfo: "RequestID, buyer",
      func: propertyRequestPrinter,
    },

  },
  seller: {
    listPendingForSale:{
      nameSpace: nameSpaces.property,
      args: 2,
      argsInfo: "propertyID, owner",
      func: propertyPrinter,
    },
    AcceptOffer: {
      nameSpace: nameSpaces.propertyRequest,
      args: 2,
      argsInfo: "RequestID, buyer",
      func: propertyRequestPrinter,
    },
    Reject: {
      nameSpace: nameSpaces.propertyRequest,
      args: 2,
      argsInfo: "RequestID, buyer",
      func: propertyRequestPrinter,
    },
  },
  registrar: {
    updateOwner: {
      nameSpace: nameSpaces.property,
      args: 2,
      argsInfo: "propertyID, newOwner",
      func: propertyPrinter,
    },
    Complete: {
      nameSpace: nameSpaces.propertyRequest,
      args: 2,
      argsInfo: "RequestID, buyer",
      func: propertyRequestPrinter,
    },
    Reject: {
      nameSpace: nameSpaces.propertyRequest,
      args: 2,
      argsInfo: "RequestID, buyer",
      func: propertyRequestPrinter,
    },
    listForSale: {
      nameSpace: nameSpaces.property,
      args: 2,
      argsInfo: "propertyID, owner",
      func: propertyPrinter,
    }
  }
};

const orgs = {
  manager: '1',
  buyer: '1',
  seller: '1',
  registrar: '2',
};

const main = async (userName, transaction, nameSpace, args, func) => {
    // A wallet stores a collection of identities for use
    const wallet = await Wallets.newFileSystemWallet('../identity/user/'+userName+'/wallet');


    // A gateway defines the peers used to access Fabric networks
    const gateway = new Gateway();

    // Main try/catch block
    try {

        // Load connection profile; will be used to locate a gateway
        let connectionProfile = yaml.safeLoad(fs.readFileSync('../gateway/connection-org'+orgs[userName]+'.yaml', 'utf8'));

        // Set connection options; identity and wallet
        let connectionOptions = {
            identity: userName,
            wallet: wallet,
            discovery: { enabled: true, asLocalhost: true }

        };

        // Connect to gateway using application specified parameters
        console.log('Connect to Fabric gateway.');

        await gateway.connect(connectionProfile, connectionOptions);

        // Access PaperNet network
        console.log('Use network channel: mychannel.');

        const network = await gateway.getNetwork('mychannel');

        // Get addressability to commercial paper contract
        const contract = await network.getContract('propertycontract', nameSpace);

        try{
          let response=await contract.submitTransaction(transaction, ...args);
          func(response);
        } catch(e){
            console.log("**********ERROR**********");
            console.log(e.responses[0].response.message.split(':').splice(2).join(':'));
            console.log("*************************");
        }
        // if(nameSpace === nameSpaces.property){
        //   response = Property.fromBuffer(response);
        // }
        // else{
        //   response = PropertyRequest.fromBuffer(response);
        // }
        // console.log(response);

        // // request to buy commercial paper using buy_request / transfer two-part transaction
        // console.log('Submit commercial paper buy_request transaction.');

        console.log('Transaction complete.');

    } catch (error) {

        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);

    } finally {

        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.');
        gateway.disconnect();

    }
}

try{
  if(! (argv.user in user_transaction)){
    throw ('User not registered!'+'Registered Users:\n'+Object.keys(user_transaction));
  }
  if(! (argv.transaction in user_transaction[argv.user])){
    throw ('User not authorized for this transaction!\nAuthorized Transactions:\n'+Object.keys(user_transaction[argv.user]));
  }
  if(argv._.length !== user_transaction[argv.user][argv.transaction].args){
    throw ('Wrong number of arguments passed!\n'+'Args Required:\n'+user_transaction[argv.user][argv.transaction].argsInfo);
  }
  main(argv.user, argv.transaction, user_transaction[argv.user][argv.transaction].nameSpace , argv._.map(String), user_transaction[argv.user][argv.transaction].func);
} catch (e){
  console.log(e);
}
