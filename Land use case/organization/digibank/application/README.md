## Issue Property
```
node app.js -u manager -t issue pid1 ow1 add1
```

## List Pending For Sale
```
node app.js -u seller -t listPendingForSale pid1 ow1
```

## List For Sale
```
node app.js -u registrar -t listForSale pid1 ow1
```

## Get List of Properties
```
node app.js -u buyer -t getList
```

## Initiate Offer
```
node app.js -u buyer -t initiate pid1 rid1 ow2 2500
```

## Accept Offer
```
node app.js -u seller -t AcceptOffer rid1 ow2
```

## Reject Offer
```
node app.js -u seller -t Reject rid1 ow2
```

## Finalize Offer
```
node app.js -u buyer -t FinalizeProperty rid1 ow2
```

## Do Payment
```
node app.js -u manager -t MakePayment rid1 ow2
```

## Update Owner
```
node app.js -u registrar -t updateOwner pid1 ow2
```

## Mark Request as Completed
```
node app.js -u registrar -t Complete rid1 ow2
```


