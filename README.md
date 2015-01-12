# OpenRoad

## Script for our presentation at Hack The Drive

A future with driverless cars is upon us, but BMW has always been the ultimate driving machine. In such a world, what will still compel people to drive? The feeling, the exhilaration, the experience. The adventure.

BMW’s acquisition of younger customers, who are brand-conscious and experience-driven, is critical. What better, then, to bring millenials into the BMW family than through the quintessential automotive experience: a road trip with friends somewhere, anywhere. The destination is irrelevant compared to the ultimate adventure and the BMW that delivered it.

OpenRoad plans these journeys for you in a way that is only possible with a car as connected as the i3. You tell it how adventurous you’re feeling, give it a duration, and it does everything else. Let’s take a look.

Let’s go for low adventure and medium time.

The i3 plans your expedition from there, and will only spoil the surprise if you ask it to.

Based on location, range, and the user’s duration input, we make a call to Chargepoint to find a charging station a certain distance away, then use Here to find nearby attractions, currently with an emphasis on outdoorsy activities.

When we find something that meets the criteria, an address is pushed to the i3’s nav system. For example, if we were to hop into an i3 right here, a Chargepoint station next to Lake Chabot in Alameda might be our destination.

When the party arrives at the charging station and plugs the car in, the user’s phone is sent walking directions that lead to the attraction and a suggested amount of time to spend there.

After the users finish with the attraction, they can either return to the car or walk to a restaurant where a reservation awaits (after all, the i3 knows how many people were in the car). Directions are provided, of course.

Fully recharged, the party can either head home to end their odyssey or start a new one.

When the adventure ends, trip satisfaction and comments are logged to a MongoDB backend. This lets the crew keep a record of where they’ve been and ensures that the next itinerary is a fresh one.

Here are the APIs we’re using now.

BMW for range, state of charge, and passenger information,

Chargepoint for possible locations and charging data,

Here for navigation and attractions, and Mongo for persistent storage.

The possibilities for further enhancements to the user experience are virtually limitless, as are the business opportunities that come with.

The elephant in the room, then, is range anxiety. Nothing is worse than being limited by your car...

...and Open Road turns this would-be limitation into a means of empowerment. Suddenly, urbanites can take weekly micro vacations to discover the treasures in their own back yard with complete peace of mind that they’ll make it home at the end of the day.

OpenRoad is groundbreaking because of the stories and memories that come from the adventures it enables. In order to do this, it needs vehicles that can deliver data, thrills, and a premium backdrop along the way, which brings us full circle:

BMW has been the ultimate driving machine through over 40 years of automotive innovation. When we think “ultimate”, we tend to think “best”...but the root of the word…

...Means last. With premium experiences like those OpenRoad provides, there’s no reason that BMWs won’t also be the last bastion for drivers in a world otherwise orchestrated by computers.

Thank you.

