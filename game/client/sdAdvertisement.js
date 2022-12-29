/*

	This script is used to randomize advertisements and gain money from it probably

	Note to self: This file is unfinished and may not be finished in time

	Explanation:
	"sdAdvertisement.allowed_ad_services" is used for allowing advertisement services, make sure the URL you enter in is VALID and considered safe for users to show up
	"sdAdvertisement.iframe_ad_services" will grab "sdAdvertisement.allowed_ad_services"s values

*/

class sdAdvertisement
{
	static init_class()
	{
		// "Hello"s are temporary, I don't have an ad service - Molis
		sdAdvertisement.allowed_ad_services = ['Hello','Hello','Hello','Hello']; // Return null if you don't want ads
		
		sdAdvertisement.iframe_ad_services = sdAdvertisement.allowed_ad_services; // Global services
		



		if ( sdAdvertisement.iframe_ad_services !== null )
		this.Advertise();
	}

	static Advertise()
	{
		/*
			Return value of what it should take for example, doubleclick, googleads, exc. Although the Randomize() function will change in the future because it is the incorrect way to do it
			This method/function is outdated on https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
		*/

		function Randomize()
		{
			return Math.floor( Math.random() * sdAdvertisement.iframe_ad_services.length );
		}

		console.log(Randomize()); // Sometimes returns 0, 1, 2 and 3

		/*
			The next TODO will be to simply grab the string URL from the array then create the iFrame element, like this:
			var advertisement = document.createElement('iframe'); // Or maybe not the iframe element
		*/

		//console.log( sdAdvertisement.iframe_ad_services.length ) // Hack
	}
}
sdAdvertisement.init_class();

export default sdAdvertisement;