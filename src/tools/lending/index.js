// Copyright 2025 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
'use strict'

import { quoteSupply } from './quoteSupply.js'
import { supply } from './supply.js'
import { quoteWithdraw } from './quoteWithdraw.js'
import { withdraw } from './withdraw.js'
import { quoteBorrow } from './quoteBorrow.js'
import { borrow } from './borrow.js'
import { quoteRepay } from './quoteRepay.js'
import { repay } from './repay.js'

export const lendingTools = [
  quoteSupply,
  supply,
  quoteWithdraw,
  withdraw,
  quoteBorrow,
  borrow,
  quoteRepay,
  repay
]

export const lendingReadTools = [
  quoteSupply,
  quoteWithdraw,
  quoteBorrow,
  quoteRepay
]

export const lendingWriteTools = [
  supply,
  withdraw,
  borrow,
  repay
]

export { quoteSupply, supply, quoteWithdraw, withdraw, quoteBorrow, borrow, quoteRepay, repay }