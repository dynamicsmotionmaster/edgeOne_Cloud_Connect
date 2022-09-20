$(async()=>{

    // hide initial error texts
    $("#wrong_apiURL").hide()
    $("#wrong_publicKey").hide()
    $("#wrong_privateKey").hide()


    var run_API = false
    var login_token_API = false
    var re_Login_API = null
    var start_login_timer = null

    // stop system
    $("#api_stop").click( function () {
        run_API = false
        login_token_API = false
        re_Login_API = null
        start_login_timer = null

        $("#api_start").prop('disabled', false)
        $("#api_stop").prop('disabled', true)

        update_web()
    })

    // start system
    $("#api_start").click( async function () {
        const apiURL =   $("#apiURL").val()
        const publicKey =   $("#publicKey").val()
        const privateKey =   $("#privateKey").val()
        const serialNumber =   $("#serialNumber").val()

        if( !apiURL || !publicKey || !privateKey ) {
            if(!apiURL) $("#wrong_apiURL").show()
            if(!publicKey) $("#wrong_publicKey").show()
            if(!privateKey) $("#wrong_privateKey").show()
        }
        else {
            run_API = true
            start_system_API(apiURL, publicKey, privateKey, serialNumber)
        }

        $("#api_start").prop('disabled', true)
        $("#api_stop").prop('disabled', false)
    })


    var data_API = []
    async function start_system_API(apiURL, publicKey, privateKey, serialNumber) {
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

        }
        else if( nowTime > start_login_timer+re_Login_API ) {
            const data_login = await login_api(global)

            login_token_API = data_login.signin_token
            re_Login_API = data_login.token_limit
            start_login_timer = nowTime

        }



        const data_device = await get_all(global, login_token_API)


        if(run_API) {

            data_API.push(data_device)
            await update_web(data_device, serialNumber)


            setTimeout(() => {
                start_system_API(apiURL, publicKey, privateKey, serialNumber)
            }, 5000);
        }
        else {
            data_API = []
            await update_web(false)
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



    // ---------------------- Initial state in web-page ---------------------- //
    $(".temp_font").addClass('old_font')

    var chart_doughnut = new Chart(document.getElementById('chart_doughnut').getContext("2d"), {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Remaining'],
            datasets: [{
                backgroundColor: ["#02a8b5", "#ebeff2"],
                data: [0,100],
            }]
        },
    })
    var chart_line = new Chart(document.getElementById('chart_line').getContext("2d"), {
        type: 'line',
        data: {
            // labels: ['14:10:00', '14:10:01', '14:10:02', '14:10:03', '14:10:04', '14:10:05','14:10:06', '14:10:07', '14:10:08', '14:10:09', '14:10:10'],
            labels: [],
            datasets: [{
                label: 'Production Speed',
                // data: [0,10,40,29,60,59,0,10,40,29,60],
                data: [],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.3
            }]
        },
        options: {
            scales: {
                x: {
                    ticks: {
                        maxTicksLimit: 17
                    }
                }
            }
        }
    })
    var chart_mixed = new Chart(document.getElementById('chart_mixed').getContext("2d"), {
        data: {
            // labels: ['14:10:00', '14:10:01', '14:10:02', '14:10:03', '14:10:04', '14:10:05','14:10:06', '14:10:07', '14:10:08', '14:10:09', '14:10:10', '14:10:11', '14:10:11'],
            labels: [],
            datasets: [{
                type: 'bar',
                label: 'Bar graph of Production Count',
                // data: [0,10,40,29,60,59,0,10,40,29,60,59,70],
                data: [],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                order: 2
            }, {
                type: 'line',
                label: 'Line graph of Production Count',
                // data: [0,10,40,29,60,59,0,10,40,29,60,59,70],
                data: [],
                fill: false,
                borderColor: 'rgb(54, 162, 235)',
                order: 1
            }],
            options: {
                scales: {
                    x: {
                        ticks: {
                            maxTicksLimit: 17
                        }
                    }
                }
            }
        },
    })


    // ---------------------- Update graphs in web-page ---------------------- //
    async function update_web(info=false, serialNo=false) {
        let not_system = true
        if(info) {

            let data = []
            if( serialNo && serialNo!='' ) {
                data[0] = await info.find(e => e.sub_type[0]=='counter' && e.serial_number==serialNo )
            }
            else {
                data[0] = await info.find(e => e.sub_type[0]=='counter' )
            }

            if(data.length ) {
                not_system = false

                $(".temp_font").removeClass('old_font')

                $("#dev_name").text(data[0].dev_name)
                $("#task_name").text(data[0].task_name)
                $("#task_stat").text(data[0].task_state)
                $("#task_time_start").text( new Date(data[0].task_time_start).toLocaleDateString() +" "+ new Date(data[0].task_time_start).toLocaleTimeString() )
                $("#task_time_end").text( new Date(data[0].task_time_end).toLocaleDateString() +" "+ new Date(data[0].task_time_end).toLocaleTimeString() )
                $("#max_speed").text(data[0].sub_max_speed[0])
                $("#max_speed_unit").text(data[0].sub_max_speed_unit[0])
                $("#target_amount").text(data[0].task_amount[0])


                chart_doughnut.data.datasets[0].data[0] = parseInt(data[0].sub_value[0])
                chart_doughnut.data.datasets[0].data[1] = parseInt(data[0].task_amount[0])-parseInt(data[0].sub_value[0])
                chart_doughnut.update();

                chart_line.data.labels.push( new Date(data[0].value_curr_time).toLocaleTimeString() )
                chart_line.data.datasets[0].data.push( data[0].sub_speed[0] )
                chart_line.data.datasets[0].label = `Production Speed in ${data[0].sub_speed_unit[0]}`
                if( data_API.length>18 ) {
                    chart_line.data.labels.shift()
                    chart_line.data.datasets[0].data.shift()
                }
                chart_line.update();

                chart_mixed.data.labels.push( new Date(data[0].value_curr_time).toLocaleTimeString() )
                chart_mixed.data.datasets[0].data.push( data[0].sub_value[0] )
                chart_mixed.data.datasets[1].data.push( data[0].sub_value[0] )
                if( data_API.length>18 ) {
                    chart_mixed.data.labels.shift()
                    chart_mixed.data.datasets[0].data.shift()
                    chart_mixed.data.datasets[1].data.shift()
                }
                chart_mixed.update();
            }
        }

        if(not_system) {

            $(".temp_font").addClass('old_font')

            $("#dev_name").text('device name')
            $("#task_name").text('task name')
            $("#task_stat").text('task status')
            $("#task_time_start").text('start time')
            $("#task_time_end").text('end time')
            $("#max_speed").text('0')
            $("#max_speed_unit").text('pcs/min')
            $("#target_amount").text('0')


            chart_doughnut.data.datasets[0].data[0] = 0
            chart_doughnut.data.datasets[0].data[1] = 100
            chart_doughnut.update();

            chart_line.data.labels = []
            chart_line.data.datasets[0].data = []
            chart_line.data.datasets[0].label = `Production Speed`
            chart_line.update();

            chart_mixed.data.labels = []
            chart_mixed.data.datasets[0].data = []
            chart_mixed.data.datasets[1].data = []
            chart_mixed.update();

            data_API = []
        }

        if( data_API.length>18 ) {
            data_API.shift()
        }

    }

})