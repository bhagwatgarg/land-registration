/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const PropertyContract = require('./lib/propertycontract');
const PropertyRequestContract = require('./lib/propertyrequestcontract');
module.exports.contracts = [PropertyContract, PropertyRequestContract];
