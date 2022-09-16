$(()=>{

    var run_API = false
    var login_token_API = false
    var re_Login_API = null
    var start_login_timer = null

    // hide initial error texts
    $("#wrong_apiURL").hide()
    $("#wrong_publicKey").hide()
    $("#wrong_privateKey").hide()


    $("#apiClear").click( function () {
        run_API = false
        login_token_API = false
        re_Login_API = null
        start_login_timer = null
        $("#apiResult").html('All data cleared !!!')
    })

    $("#apiConnect").click( function () {
        const apiURL =   $("#apiURL").val()
        const publicKey =   $("#publicKey").val()
        const privateKey =   $("#privateKey").val()

        if( !apiURL || !publicKey || !privateKey ) {
            $("#wrong_apiURL").show()
            $("#wrong_publicKey").show()
            $("#wrong_privateKey").show()
        }
        else {

            run_API = true
            start_system_API(apiURL, publicKey, privateKey)

        }
        
    })



    async function start_system_API(apiURL, publicKey, privateKey) {
        const nowTime = (new Date()).getTime()
        const global = {
            api_URL: apiURL,
            public_key: publicKey,
            private_key: privateKey
        }

        if( !login_token_API ) {
            const data_login = await login_api(global)

            login_token_API = data_login.signin_token
            re_Login_API = data_login.token_limit
            start_login_timer = nowTime

            $("#tokenNumber").val(login_token_API)
            const now = new Date( parseInt(new Date().getTime()) + re_Login_API );
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            $("#tokenExpire").val(now.toISOString().slice(0,16))
        }
        else if( nowTime > start_login_timer+re_Login_API ) {
            const data_login = await login_api(global)

            login_token_API = data_login.signin_token
            re_Login_API = data_login.token_limit
            start_login_timer = nowTime

            $("#tokenNumber").val(login_token_API)
            const now = new Date( parseInt(new Date().getTime()) + re_Login_API );
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            $("#tokenExpire").val(now.toISOString().slice(0,16))
        }



        const data_device = await get_all(global, login_token_API)


        if(run_API) {

            $("#apiResult").html(JSON.stringify(data_device, null, 4))

            setTimeout(() => {
                start_system_API(apiURL, publicKey, privateKey)
            }, 5000);
        }
        
    }


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
            console.log('dataBody');
            console.log(dataBody);
            const opts = { 
                method: "POST",
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
        const signin_token = data.data.login.signin_token
        const token_limit = parseInt( data.data.login.maxAge )

        return {signin_token, token_limit }

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
        return data.data.current_info_all
    
    }

})