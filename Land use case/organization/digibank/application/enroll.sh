#!/bin/bash
node enroll_buyer.js
node enroll_manager.js
node enroll_seller.js
cd ../../magnetocorp/application/
node enrollUser.js