const global = require('./global')
const fetch = require('node-fetch');


var signin_token = null
var reset_token = null

// ---------------------- LOGIN ---------------------- //
async function login_api( info ) {
    let response
    try {
        const query = `
            query {
                login(public_key: "${info.public_key}", private_key: "${info.private_key}" ) {
                    public_key
                    signin_token
                    login
                    expires
                    maxAge
                }
            }
        `
        const dataBody = JSON.stringify({ query })
        const opts = { 
            method: "POST",
            withCredentials: true,
            credentials: 'include',
            headers: { 
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: dataBody
        };
        response = await fetch(info.api_URL, opts);
    } catch (err) {
        // Fetch error
        console.log("--------------------------------")
        console.log(err.toString())
        console.log(String(new Error().stack).split('\n')[1])
        console.log("--------------------------------")
        return console.log(err)
    }

    // Status error
    if (response.status >= 400) {
        const err = await response.json();
        console.log("--------------------------------")
        console.log(err.toString())
        console.log(String(new Error().stack).split('\n')[1])
        console.log("--------------------------------")
        return console.log(err)
    }

    const data = await response.json();
    console.log(data.data.login);

    signin_token = data.data.login.signin_token
    reset_token = parseInt( data.data.login.maxAge )

}


// ---------------------- Get All data ---------------------- //
async function get_all( info, token ) {
    let response
    try {
        const query = `
            query {
                current_info_all {
                    serial_number
                    dev_name
                    sub_id
                    sub_name
                    sub_type
                    sub_value
                    sub_value_unit
                    sub_value_msg
                    value_curr_time
                    sub_status
                    sub_speed
                    sub_speed_unit
                    sub_max_speed
                    sub_max_speed_unit
                    notification {
                        id
                        day
                        msg
                    }
                    task_needed
                    task_id
                    task_name
                    task_state
                    task_sub_id
                    task_amount
                    task_amount_unit
                    task_amount_msg
                    task_time_start
                    task_time_end
                    task_user_start
                    task_user_end
                    task_finish_amount
                    task_finish_amount_unit
                    task_finish_amount_msg
                    task_good_amount
                    task_good_amount_unit
                    task_good_amount_msg
                    task_status
                }
            }
        `
        const dataBody = JSON.stringify({ query })
        const opts = { 
            method: "POST",
            withCredentials: true,
            credentials: 'include',
            headers: { 
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: dataBody
        };
        response = await fetch(info.api_URL, opts);
    } catch (err) {
        // Fetch error
        console.log("--------------------------------")
        console.log(err.toString())
        console.log(String(new Error().stack).split('\n')[1])
        console.log("--------------------------------")
        return console.log(err)
    }

    // Status error
    if (response.status >= 400) {
        const err = await response.json();
        console.log("--------------------------------")
        console.log(err.toString())
        console.log(String(new Error().stack).split('\n')[1])
        console.log("--------------------------------")
        return console.log(err)
    }

    const data = await response.json();
    console.log(data.data.current_info_all);

}


// ---------------------- Get 1 Device data ---------------------- //
async function get_one( info, token, dev_serial ) {
    let response
    try {
        let query = `
            query {
                current_info_one(serial_number: "${dev_serial}") {
                    serial_number
                    sub_name
                    sub_type
                    sub_value
                    sub_value_unit
                    sub_status
                    sub_speed
                    sub_speed_unit
                    sub_max_speed
                    sub_max_speed_unit
                    task_needed
                    task_id
                    task_name
                    task_state
                    task_sub_id
                    task_amount
                    task_amount_unit
                    task_time_start
                    task_time_end
                    task_user_start
                    task_user_end
                    task_finish_amount
                    task_finish_amount_unit
                    task_good_amount
                    task_good_amount_unit
                    task_status
                }
            }
        `
        const dataBody = JSON.stringify({ query })
        const opts = { 
            method: "POST",
            withCredentials: true,
            credentials: 'include',
            headers: { 
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: dataBody
        };
        response = await fetch(info.api_URL, opts);
    } catch (err) {
        // Fetch error
        console.log("--------------------------------")
        console.log(err.toString())
        console.log(String(new Error().stack).split('\n')[1])
        console.log("--------------------------------")
        return console.log(err)
    }

    // Status error
    if (response.status >= 400) {
        const err = await response.json();
        console.log("--------------------------------")
        console.log(err.toString())
        console.log(String(new Error().stack).split('\n')[1])
        console.log("--------------------------------")
        return console.log(err)
    }

    const data = await response.json();
    console.log(data.data.current_info_one);

}




async function Start_system_step() {
    console.log('---------------------- Login DATA ----------------------');
    await login_api(global)
    console.log('---------------------- All DATA ----------------------');
    await get_all(global, signin_token)
    console.log('---------------------- One Dev DATA ----------------------');
    await get_one(global, signin_token, 'serial_edgeone01_98789')
}
Start_system_step()


