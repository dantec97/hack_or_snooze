"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

// Correct initialization of storyList as an instance of StoryList

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    try {
      const urlObject = new URL(this.url);
      return urlObject.hostname;
    } catch (err) {
      console.error("Invalid URL in story:", this.url);
      return "unknown";
    }
}
}

/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
    
  }
  

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, newStory) {
    // Extract the user's token from the user object
    const token = user.loginToken;
  
    try {
      // Make a POST request to the API to add a new story
      const response = await axios.post('https://hack-or-snooze-v3.herokuapp.com/stories', {
        token, 
        story: newStory  // Pass the new story data (title, author, url)
      });
  
      // Create a new instance of the Story class from the response data
      const createdStory = new Story(response.data.story);
  
      // Add the new story to the beginning of the stories list (optional, if needed)
      this.stories.unshift(createdStory);
  
      // Return the new story instance
      return createdStory;
  
    } catch (err) {
      console.error('Error adding story:', err);
      throw err;  // Optionally re-throw the error to handle it further up the call stack
    }
    
  }
  
  async removeStory(user, storyId) {
    const token = user.loginToken;
    console.log("Deleting story with ID:", storyId); // Log the story ID
    
      const response = await axios.delete(`https://hack-or-snooze-v3.herokuapp.com/stories/${storyId}`, {
        data: { token }
      });
  
      if (response.data.success) {
        const storyIndex = this.stories.findIndex(story => story.storyId === storyId);
        if (storyIndex > -1) {
          this.stories.splice(storyIndex, 1);
        }
      } else {
        throw new Error("Failed to delete story");
      }
    
  }
  
  

}
  



/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */
class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */
  

  constructor({
    
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = []
              },
              token) {

    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(name, username, password) {
    try {
      const response = await axios.post('https://hack-or-snooze-v3.herokuapp.com/signup', {
        user: { name, username, password }
      });

      // Return user instance based on API response
      return new User(
        response.data.user.username,
        response.data.user.name,
        response.data.user.createdAt,
        response.data.token
      );
    } catch (error) {
      console.error('Error during signup:', error.response?.status, error.response?.data);
      throw error; // Re-throw the error to handle it where this method is called
    }
  }

  

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }
  
  async favoriteStory(storyId) {
    try {
      if (!this.loginToken) {
        throw new Error("Token is missing");
      }
  
      const response = await axios.post(
        `https://hack-or-snooze-v3.herokuapp.com/users/${this.username}/favorites/${storyId}`,
        {
          token: this.loginToken,  // Send token in the body
        },
        {}
      );
      
      this.favorites.push(storyId); // Add to local favorites
      return response.data;
    } catch (err) {
      console.error('Error favoriting story:', err);
      throw err;
    }
  }
  
  
  
  
  

  async unfavoriteStory(storyId) {
    try {
      if (!this.loginToken) {
        throw new Error("Token is missing");
      }
  
      // Send request to API to unfavorite a story with token in the body
      const response = await axios.delete(
        `https://hack-or-snooze-v3.herokuapp.com/users/${this.username}/favorites/${storyId}`,
        {
          data: { token: this.loginToken }  // Use `data` to send the token in the body
        }
      );
  
      // Remove the story from the local favorites list
      const index = this.favorites.indexOf(storyId);
  
      if (index > -1) {
        this.favorites.splice(index, 1);  // Remove from local favorites
      }
  
      return response.data;
    } catch (err) {
      console.error('Error unfavoriting story:', err);
      throw err;
    }
  }
  
}

