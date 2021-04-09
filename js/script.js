/**
 * @script.js   CISW 400 Final Prject
 * @author Peter Wirtz
 */
(function () {
  'use strict';

  // Search Section
  const engineURLS = {
    google: 'https://www.google.com/search?q=',
    duckduckgo: 'https://duckduckgo.com/?q=',
    startpage: 'https://www.startpage.com/do/search?query=',
    stackoverflow: 'https://stackoverflow.com/search?q=',
  };

  /**
   * Handles search input form and function
   */
  const search = () => {
    const terms = document.getElementById('search_term');
    if (terms.value.trim() != '') {
      // regex replaces all spaces with + signs
      const queryString = terms.value.replace(/( +)/g, '+');
      const engine = document.getElementById('engine');
      const searchURL = `${engineURLS[engine.value]}${queryString}`;
      terms.value = '';
      window.open(searchURL);
    } else {
      console.log('needs data');
    }
  };

  // Podcast Section
  const podcastRssURLS = {
    theDaily: {
      title: 'The Daily',
      url: 'https://rss.art19.com/the-daily',
    },
    thisAmericanLife: {
      title: 'This American Life',
      url: 'http://feed.thisamericanlife.org/talpodcast',
    },
    radioLab: {
      title: 'Radiolab',
      url: 'http://feeds.wnyc.org/radiolab',
    },
  };

  /**
   * Writes each podcast from podcastRssURLS into dropdown list
   */
  const writePodcastList = () => {
    let selElem = document.getElementById('podcasts-dropdown');
    Object.keys(podcastRssURLS).forEach(feed => {
      const optionText = document.createTextNode(podcastRssURLS[feed].title);
      const optionNode = document.createElement('option');
      optionNode.appendChild(optionText);
      optionNode.setAttribute('value', feed);
      selElem.appendChild(optionNode);
    });
  };

  /**
   * Duh
   */
  const resetPodcastForm = () => {
    document.getElementById('podcasts-dropdown').style.border = null;
    document.getElementById('podcasts-dropdown').selectedIndex = 0;
    document.getElementById('search').style.border = null;
    document.getElementById('search').value = '';
    document.getElementById('search').style.display = 'none';
    document.getElementById('getPCbtn').style.display = 'none';
  };

  /**
   * Runs when the podcast get/search button is pressed
   * Logic for what is selected in dropdown
   */
  const onPodcastSubmit = () => {
    const rssUrlDropdown = document.getElementById('podcasts-dropdown');
    const searchBox = document.getElementById('search');
    if (rssUrlDropdown.value == 'search') {
      const terms = searchBox.value;
      if (terms.trim() !== '' && terms.trim() !== '+') {
        resetPodcastForm();
        searchPodcast(terms)
          .then(url => getLatestPodcast(url))
          .catch(error => {
            if (error.name == 'TypeError') {
              document.getElementById('error').innerHTML =
                'Error: Probably a CORS issue.';
              console.error(error);
            } else {
              document.getElementById('error').innerHTML = error.message;
            }
          });
      } else {
        searchBox.style.border = '1px solid red';
      }
    } else {
      const rssUrl = podcastRssURLS[rssUrlDropdown.value].url;
      resetPodcastForm();
      getLatestPodcast(rssUrl);
    }
  };

  /**
   * Uses Apple iTunes API to search for podcasts
   * @param   {String} terms    series of words separated by +
   * @return  {String}          URL to podcast RSS feed
   * @throws                    Throws Error if response.ok false
   *                            or if search results were 0
   */
  const searchPodcast = async terms => {
    terms = encodeURIComponent(terms);
    const resultsUrl = await fetch(
      `https://itunes.apple.com/search?term=${terms}&entity=podcast&limit=10`
    )
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw Error(`Unexpected response status ${response.status}`);
        }
      })
      .then(json => {
        if (json.results.length > 0) {
          return json.results[0].feedUrl;
        } else {
          throw new Error('No results found.');
        }
      });

    return resultsUrl;
  };

  /**
   * Displays the newest podcast in a player
   * @param {string}  rssURL  podcast feed url
   */
  const getLatestPodcast = rssURL => {
    const info = document.getElementById('info');
    info.innerHTML = `
            <div class="spinner">
              <div class="bounce1"></div>
              <div class="bounce2"></div>
              <div class="bounce3"></div>
            </div>`;

    // setTimeout(() => {
      getJSONFromRSS(rssURL)
        .then(data => {
          if (!!(data.status === 'ok')) {
            const episode = data.items[0];
            const pubDate = new Date(episode.pubDate).toDateString();
            info.innerHTML = `
            <img src="${data.feed.image}" id="thumb" width="50px" alt="thumbnail">
            <p>
              Title: ${episode.title}<br>
              Published: ${pubDate}
            </p>
          `;
            document.getElementById('source').src = episode.enclosure.link;
            document.getElementById('player').load();
          } else {
            throw data;
          }
        })
        .catch(error => {
          document.getElementById('error').innerHTML = error;
          console.error(error);
        });
    // }, 500);
  };

  // News Section
  const newsRssURLS = {
    nytHeadlines: {
      title: 'NY Times Front Page',
      url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    },
    nytTech: {
      title: 'NY Times Tech',
      url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
    },
    bbcNews: {
      title: 'BBC World News',
      url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    },
    waPoWorldNews: {
      title: 'Washington Post World News',
      url: 'http://feeds.washingtonpost.com/rss/world',
    },
  };

  /**
   * For every news feed in newsRssURLS, write placeholders into HTML
   */
  const writeNewsHTML = () => {
    const newsNav = document.querySelector('#newsnav ul');
    const newsDiv = document.getElementById('news');
    const select = document.querySelector('#newsnav select');
    let first = true;
    for (let [key, value] of Object.entries(newsRssURLS)) {
      // Write the nav links
      const listNode = document.createElement('li');
      const linkNode = document.createElement('a');
      const linkText = document.createTextNode(`${value.title}`);
      const linkAttribute = `#${key}`;
      linkNode.appendChild(linkText);
      linkNode.setAttribute('href', linkAttribute);
      listNode.appendChild(linkNode);
      newsNav.appendChild(listNode);

      // Write the select menu
      const optionNode = document.createElement('option');
      const optionText = document.createTextNode(`${value.title}`);
      optionNode.value = `#${key}`;
      optionNode.appendChild(optionText);
      select.appendChild(optionNode);

      // Now write the news
      const sourceDiv = document.createElement('div');
      sourceDiv.setAttribute('id', key);
      if (first) {
        sourceDiv.style.display = 'block';
        linkNode.className = 'active';
        first = false;
      } else {
        sourceDiv.style.display = 'none';
        linkNode.className = 'inactive';
      }
      newsDiv.appendChild(sourceDiv);
    }
  };

  /**
   * For every news feed in newsRssURLS, writes stories into placeholders
   */
  const getNews = () => {
    let first = true;
    for (let [key, value] of Object.entries(newsRssURLS)) {
      getJSONFromRSS(value.url)
        .then(data => {
          const sourceDiv = document.getElementById(key);
          if (!!(data.status === 'ok')) {
            sourceDiv.innerHTML = `<h5>${value.title}</h5>`;
            const articles = data.items;
            articles.forEach(article => {
              const articleNode = document.createElement('article');
              const pubDate = new Date(article.pubDate).toDateString();
              articleNode.innerHTML = `
                <h5><a href="${article.link}" target="_blank">
                ${article.title}</a></h5>
                ${pubDate}<p>${article.description}</p>`;
              sourceDiv.appendChild(articleNode);
            });
          } else {
            throw data;
          }
        })
        .catch(reason => {
          document.getElementById('headlines').innerHTML =
            'There was an error retrieving news.';
          console.error(reason);
        });
    }
  };

  // Helper Functions

  /**
   * Uses the rss2json api from rss2json.com to make parsing rss easier
   * because XML sucks to parse.
   * @param   {String}  feedURL   Hopefully a url to the location of the rss feed
   * @return  {Object}            Promise with parsed JSON obj
   * @throws                      Throws Error Response is not ok
   */
  const getJSONFromRSS = async feedURL => {
    // Using the rss2json api here as I needed because some of the RSS
    // feeds I was trying to fetch weren't allowed due to CORS
    const rss2json = 'https://api.rss2json.com/v1/api.json?rss_url=';
    const escapedURL = encodeURIComponent(feedURL);
    const json = await fetch(`${rss2json}${escapedURL}`).then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(`Unexpected response status ${response.status}`);
      }
    });
    return json;
  };

  /**
   * Entry point is here
   */
  (function () {
    'use strict';

    document.getElementById('date').innerHTML = `${new Date(
      Date.now()
    ).toDateString()}`;

    // Search setup
    document.getElementById('searchform').addEventListener('submit', search);

    // Podcast setup
    writePodcastList();
    document
      .getElementById('podcasts-dropdown')
      .addEventListener('change', e => {
        document.getElementById('error').innerHTML = '';
        const searchBox = document.getElementById('search');
        const getPCbtn = document.getElementById('getPCbtn');
        if (e.target.options.selectedIndex == 1) {
          // Show the search text entry box if Search option was selected
          document.getElementById('getPCbtn').value = 'search';
          searchBox.style.display = 'inline';
        } else {
          // Named podcast was selected,
          // Put the name of selected podcast on button
          searchBox.style.display = 'none';
          const pcName =
            e.target.options[e.target.options.selectedIndex].innerHTML;
          getPCbtn.value = `Get "${pcName}".`;
        }
        getPCbtn.style.display = 'inline';
      });
    document
      .getElementById('pSelect')
      .addEventListener('submit', onPodcastSubmit);

    // News setup
    writeNewsHTML();
    getNews();

    // add event listeners to all the nav links to toggle
    // visibility of the different news sources
    document.querySelectorAll('#newsnav ul li a').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const clickedLinkLoc = link.getAttribute('href').slice(1);

        // Hide all news sources
        document.querySelectorAll('#newsnav ul li a').forEach(aElement => {
          const thisAloc = aElement.getAttribute('href').slice(1);
          aElement.className = 'inactive';
          document.getElementById(thisAloc).style.display = 'none';
        });

        // Show clicked news source
        link.className = 'active';
        document.getElementById(clickedLinkLoc).style.display = 'block';

        // Change drop down list to match whats selected in the nav links
        const selectList = document.querySelector('#newsnav select');
        for (let i = 0, len = selectList.options.length; i < len; i++) {
          if (selectList.options[i].value === `#${clickedLinkLoc}`) {
            selectList.selectedIndex = i;
          }
        }
      });
    });

    // Add event listener to add functionality to the drop down news menu
    document.querySelector('#newsnav select').addEventListener('change', e => {
      const href = e.target.options[e.target.options.selectedIndex].value;
      document.querySelector(`[href='${href}']`).click();
    });
  })();
})();
