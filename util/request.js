import axios from 'axios';

export default axios.create ({
    baseURL: 'https://jessite.atlassian.net/rest/api/3',
    headers: {
        'Authorization': `Basic ${Buffer.from(
            'jesseigowe.ji@gmail.com:sEFwudtIE9DyYajyWaajD8B1'
          ).toString('base64')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
    }
});