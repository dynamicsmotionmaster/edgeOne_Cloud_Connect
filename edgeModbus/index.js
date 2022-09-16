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

        if( !apiURL || !publicKey || !privateKey ) {
            if(!apiURL) $("#wrong_apiURL").show()
            if(!publicKey) $("#wrong_publicKey").show()
            if(!privateKey) $("#wrong_privateKey").show()
        }
        else {
            run_API = true
            start_system_API(apiURL, publicKey, privateKey)

        }

        $("#api_start").prop('disabled', true)
        $("#api_stop").prop('disabled', false)
    })


    var data_API = []
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
            await update_web(data_device)


            setTimeout(() => {
                start_system_API(apiURL, publicKey, privateKey)
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

    var html_dev = []
    var chart_line = []


    // ---------------------- Update graphs in web-page ---------------------- //
    async function update_web(info=false) {
        let not_system = true
        if(info) {

            let data = []
            data[0] = await info.find(e => e.sub_type[0]=='energy' )

            if(data.length ) {
                not_system = false

                $(".temp_font").removeClass('old_font')

                $("#dev_name").text(data[0].dev_name)
                
                let sub_devs = data[0].sub_name
                for (let i = 0; i < sub_devs.length; i++) {
                    const element = sub_devs[i];
                    let sub_name = element.split(';;')[0]
                    let sub_type = element.split(';;')[1]
                    let sub_value = data[0].sub_value[i]
                    let sub_unit = data[0].sub_value_unit[i]

                    const temp_i = html_dev.findIndex( e => e.sub_name == sub_name )

                    // new device sub
                    if( temp_i == -1 ) {

                        html_dev.push({
                            sub_name: sub_name,
                            sub_type: [sub_type],
                            sub_value: [sub_value],
                            sub_unit: [sub_unit]
                        })
                        const temp_i_new = html_dev.findIndex( e => e.sub_name == sub_name )


                        let HTML_mach_sub_devices = `
                        <div class="col-12 row p-0 m-0 sub_card_box " >
                            <div class="col-2 row p-2 m-0 " >
                                <div class="col-12 row p-0 m-0 align-items-center justify-content-center white_box " >
                                    <div id="dev_sub_name_${temp_i_new}" class="col-auto temp_font font_title " >dev sub name</div>
                                </div>
                            </div>
                            <div class="col-12 row p-2 m-0 justify-content-around " id="mach_sub_chart_${temp_i_new}" >
                                <div class="col-2 row p-2 m-0 align-items-center justify-content-center " >
                                    <div id="dev_sub_value_${temp_i_new}_0" class="col-12 temp_font font_title white_box text-center p-5 " >0</div>
                                    <div id="dev_sub_type_${temp_i_new}_0" class="col-12 temp_font font_title white_box text-center " >dev sub type</div>
                                </div>
                                <div class="col-9 row p-2 m-0 " >
                                    <div class="col-12 row p-0 m-0 white_box " >
                                        <canvas id="chart_line_${temp_i_new}_0" height="50" ></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                        `
                        await $("#mach_sub_devices").append(HTML_mach_sub_devices)
                        chart_line[temp_i_new] = []
                        chart_line[temp_i_new][0] = await new Chart(document.getElementById(`chart_line_${temp_i_new}_0`).getContext("2d"), {
                            type: 'line',
                            data: {
                                labels: [],
                                datasets: [{
                                    label: `Sensor value in ${sub_unit}`,
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

                        $(`#dev_sub_name_${temp_i_new}`).text(sub_name)
                        $(`#dev_sub_type_${temp_i_new}_0`).text(sub_type)
                        $(`#dev_sub_value_${temp_i_new}_0`).text(sub_value +' '+ sub_unit)

                        await update_chart( chart_line[temp_i_new][0], new Date(data[0].value_curr_time).toLocaleTimeString(), sub_value, `Sensor value in ${sub_unit}` )
                    }
                    else {

                        html_dev[temp_i].sub_name = sub_name

                        const temp_sub_i = html_dev[temp_i].sub_type.findIndex( e => e == sub_type )

                        // new device type
                        if( temp_sub_i == -1 ) {

                            html_dev[temp_i].sub_type.push(sub_type)
                            html_dev[temp_i].sub_value.push(sub_value)
                            html_dev[temp_i].sub_unit.push(sub_unit)

                            const temp_sub_i_new = html_dev[temp_i].sub_type.findIndex( e => e == sub_type )

                            let HTML_mach_sub_chart = `
                            <div class="col-2 row p-2 m-0 align-items-center justify-content-center " >
                                <div id="dev_sub_value_${temp_i}_${temp_sub_i_new}" class="col-12 temp_font font_title white_box text-center p-5 " >0</div>
                                <div id="dev_sub_type_${temp_i}_${temp_sub_i_new}" class="col-12 temp_font font_title white_box text-center " >dev sub type</div>
                            </div>
                            <div class="col-9 row p-2 m-0 " >
                                <div class="col-12 row p-0 m-0 white_box " >
                                    <canvas id="chart_line_${temp_i}_${temp_sub_i_new}" height="50" ></canvas>
                                </div>
                            </div>
                            `
                            await $(`#mach_sub_chart_${temp_i}`).append(HTML_mach_sub_chart)
                            chart_line[temp_i][temp_sub_i_new] = await new Chart(document.getElementById(`chart_line_${temp_i}_${temp_sub_i_new}`).getContext("2d"), {
                                type: 'line',
                                data: {
                                    labels: [],
                                    datasets: [{
                                        label: `Sensor value in ${sub_unit}`,
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

                            $(`#dev_sub_type_${temp_i}_${temp_sub_i_new}`).text(sub_type)
                            $(`#dev_sub_value_${temp_i}_${temp_sub_i_new}`).text(sub_value +' '+ sub_unit)

                            await update_chart( chart_line[temp_i][temp_sub_i_new], new Date(data[0].value_curr_time).toLocaleTimeString(), sub_value, `Sensor value in ${sub_unit}` )
                        }
                        else {

                            html_dev[temp_i].sub_type[temp_sub_i] = sub_type
                            html_dev[temp_i].sub_value[temp_sub_i] = sub_value
                            html_dev[temp_i].sub_unit[temp_sub_i] = sub_unit

                            $(`#dev_sub_type_${temp_i}_${temp_sub_i}`).text(sub_type)
                            $(`#dev_sub_value_${temp_i}_${temp_sub_i}`).text(sub_value +' '+ sub_unit)

                            await update_chart( chart_line[temp_i][temp_sub_i], new Date(data[0].value_curr_time).toLocaleTimeString(), sub_value )
                        }
                        
                    }

                }


            }

        }

        if(not_system) {
            $(".temp_font").addClass('old_font')
            $("#dev_name").text('device name')
            await $("#mach_sub_devices").html('')

            data_API = []
            html_dev = []
            chart_line = []

        }

        if( data_API.length>18 ) {
            data_API.shift()
        }
    }

    async function update_chart(chart1,labels,data,label=false) {
        let chart = chart1

        chart.data.labels.push( labels )
        chart.data.datasets[0].data.push( data )
        if(label) {
            chart.data.datasets[0].label = label
        }
        if( data_API.length>18 ) {
            chart.data.labels.shift()
            chart.data.datasets[0].data.shift()
        }
        await chart.update();
        
        return true
    }

})