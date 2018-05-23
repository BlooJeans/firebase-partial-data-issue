## Install
`npm install`
`npm run dev`

## Description
There's a data inconsistency bug where a `childItem.on(value)` fires with a subset of data.  The data does eventually correct itself, but it feels wrong to fire an onValue() with only a subset of data, especially since the data is still loaded via a different query.

High level overview of the steps required: You have two high-level listeners which meet certain specific conditions, which return a childItem.  You then do a "default query" `childItem.on(value)`, then `childItem.update()`, and then `childItem.off(value)`.  If you then readd `childItem.on(value)`, it will fire onValue twice: once with a subset of the childItem, and a second time with the full childItem

I think the best way I can describe it is through a fairly staged/nuanced walk through.

1. Two queries on the same path are added with .on(value) listeners
 - QueryA needs to be `orderByChild(fieldName)` with a condition that results in no items being found (e.g. `orderByChild('isPinned').equalTo(true)`)
 - QueryB can be an `orderByChild()` or `orderByKey()` or forego an `orderByX()`, but this bug will not manifest if it's a default query, so it needs some sort of query parameter (`limitToLast(x)` works)

*important*: this problem does NOT happen if QueryA returns 1 or more items.  This only seems to occur if the `orderByChild()` query returns no items.  You do, however, need an indexOn: ["fieldName"], so that firebase does not download the entire data set, which avoids the bug at the cost of downloading everything)

  e.g.
  `QueryA firebase.database().ref('/firebaseIssueTest').orderByChild('isPinned').equalTo(true);`
  `QueryB firebase.database().ref('/firebaseIssueTest').limitToLast(15);`


2. The two listeners return their onValue()s (with the orderbyChild query returning null)
  e.g.
  `QueryA onValue(): null`
  `QueryB onValue(): [itemA,itemB]`


3. A third query, QueryC is then added with a .on(value) on one of the items found in QueryB
    QueryC must not have any query parameters, or this problem does not manifest.
    If the item was unseen until this point, the bug does not trigger; it must exist in the cache from queryB.  
  e.g.
  `itemA.on(value)`


4. QueryC onValue() fires
  e.g.
  `QueryC onValue(): { color: 'blue', name: 'sky' }`


5. `item.update({ name: 'ocean' })`


6. everything is still fine at this point, QueryB fires onValue with the "full" updated tree, and QueryC onValue fires with the updated fields
  e.g.
  `QueryC onValue(): { color: 'blue', name: 'ocean' }`


7. `QueryC.off(value) `


8. Re-add `QueryC.on(value)`


9. QueryC onValue() fires with a partial cache / subset of the actual item.  It only contains the fields that .update() was called with in step 5)
  e.g.
  `QueryC onValue(): { name: 'ocean' }` // missing color!


10. QueryC onValue() fires again with the full item, everything is ok at this point
  e.g.
  `QueryC onValue(): { color: 'blue', name: 'ocean' }` // color is back

