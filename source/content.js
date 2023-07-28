import optionsStorage from './options-storage.js';

console.log('💈 Content script loaded for', chrome.runtime.getManifest().name);

function calculateScore(allRatings) {
    const N = Object.values(allRatings).reduce((a, b) => a + b, 0); // total ratings
    const K = 5; // 5 stars rating
    const z = 1.65; // the 1−α/2 quantile of a normal distribution, means that 95% of the time, the item will have an average rating greater than X

    let mean = 0;

    Object.keys(allRatings).forEach(function(i) {
        mean += i * (allRatings[i] + 1) / (N + K);
    });

    let mean2 = 0;
    Object.keys(allRatings).forEach(function(i) {
        mean2 += Math.pow(i,2) * (allRatings[i] + 1) / (N + K);
    });

    return mean - (z * Math.sqrt((mean2 - Math.pow(mean, 2)) / (N + K + 1)));
}

function getRatings() {
	// /html/body/div[3]/div[9]/div[9]/div/div/div[1]/div[2]/div/div[1]/div/div/div[3]/div[1]/div/div[1]/table/tbody/tr[1]
	// html body.LoJzbe.keynav-mode-off.screen-mode div#app-container.vasquette.id-app-container.y2iKwd.eZfyae.cSgCkb.xcUKcd.pane-open-mode div#content-container.id-content-container div#QA0Szd div div.XltNde.tTVLSc div.w6VYqd div.bJzME.tTVLSc div.k7jAl.lJ3Kh.miFGmb div.e07Vkf.kA9KIf div.aIFcqe div.m6QErb.WNBkOb div.m6QErb.DxyBCb.kA9KIf.dS8AEf div.PPCwl div.Bd93Zb div.ExlQHd table tbody tr.BHOKXe

	// div#content-container.id-content-container
 	// tr[role=img and aria-label contains # étoiles, # avis]
 const iterator = document.evaluate(
    "//div[@id='content-container']//tr[@role='img']",
    document,
    null,
    XPathResult.UNORDERED_NODE_ITERATOR_TYPE,
    null,
  );

  let allRatings = {};

  try {
    let thisNode = iterator.iterateNext();
  
    while (thisNode) {
      const ariaLabel = thisNode.getAttribute("aria-label");
      const ratings = /^(?<starcount>\d) [^\s,]+, (?<ratingcount>\d+) [^\s]+$/.exec(ariaLabel).groups;
    
      allRatings[ratings["starcount"]] = Number(ratings["ratingcount"]);

      thisNode = iterator.iterateNext();
    }
  } catch (e) {
    console.error(`Error: Document tree modified during iteration ${e}`);
  }

  const score = calculateScore(allRatings);
  console.log(score);
  return score;
}

async function init() {
	// const options = await optionsStorage.getAll();
	// const color = 'rgb(' + options.colorRed + ', ' + options.colorGreen + ',' + options.colorBlue + ')';
	// const text = options.text;
	// const notice = document.createElement('div');
	// notice.innerHTML = text;
	// document.body.prepend(notice);
	// notice.id = 'text-notice';
	// notice.style.border = '2px solid ' + color;
	// notice.style.color = color;

	const interval = setInterval(function() {
		
		let spanElementScore = document.getElementById("custom-rating-score");

		if (spanElementScore){
			return;
		}

		const ratingScore = getRatings();

		if(ratingScore != 0){
			// clearInterval(interval);

			const iterator = document.evaluate(
				"//div[@id='content-container']//h1",
				document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null
			);

			try {
				let thisNode = iterator.iterateNext();

				let scoreSpan = document.createElement("span");
				scoreSpan.id = "custom-rating-score";
				scoreSpan.textContent = "(" + ratingScore.toFixed(2) + ")";
				scoreSpan.style.cssText = "font-weight: bold;padding: 5px;color: blue;";
			  
				while (thisNode) {
				  thisNode.appendChild(scoreSpan);
				  break;
				}
			  } catch (e) {
				console.error(`Error: Document tree modified during iteration ${e}`);
			}

			// #QA0Szd > div > div > div.w6VYqd > div:nth-child(2) > div > div.e07Vkf.kA9KIf > div > div > div.TIHn2 > div > div.lMbq3e > div:nth-child(1) > h1
			// //*[@id="QA0Szd"]/div/div/div[1]/div[2]/div/div[1]/div/div/div[2]/div/div[1]/div[1]/h1
			// /html/body/div[4]/div[9]/div[9]/div/div/div[1]/div[2]/div/div[1]/div/div/div[2]/div/div[1]/div[1]/h1	

		}
	}, 1000); 
}

init();

