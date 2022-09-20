from inspect import currentframe, getframeinfo
import json
import requests

cf = currentframe()
filename = getframeinfo(cf).filename

signin_token = None
reset_token = None


# ---------------------- LOGIN ----------------------
def login( info ):
    global cf, filename, signin_token, reset_token

    query = f'''
        query {{
            login(public_key: "{info['public_key']}", private_key: "{info['private_key']}" ) {{
                public_key
                signin_token
                login
                expires
                maxAge
            }}
        }}
    '''
    dataBody = '{"query" : '+json.dumps(query)+'}'
    dataHead = { 
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
    }
    resp = requests.get(info['api_URL'], data=dataBody, headers=dataHead)

    if (resp.status_code!=200):
        sys_error = f'''
--------------------------------
    Error occured in file "{filename}" at line {cf.f_lineno}
    {json.loads(resp.text)}
--------------------------------
'''
        return print(sys_error)

    data = resp.json()['data']['login']
    signin_token = data['signin_token']
    reset_token = data['maxAge']

    print(data)
    # return data

# ---------------------- Get All data ----------------------
def get_all( info, token ):
    global cf, filename, signin_token, reset_token

    query = f'''
        query {{
            current_info_all {{
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
                notification {{
                    id
                    day
                    msg
                }}
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
            }}
        }}
    '''
    dataBody = '{"query" : '+json.dumps(query)+'}'
    dataHead = { 
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    resp = requests.get(info['api_URL'], data=dataBody, headers=dataHead)

    if (resp.status_code!=200):
        sys_error = f'''
--------------------------------
    Error occured in file "{filename}" at line {cf.f_lineno}
    {json.loads(resp.text)}
--------------------------------
'''
        return print(sys_error)
    
    data = resp.json()['data']['current_info_all']

    print(data)
    # return data

# ---------------------- Get 1 Device data ----------------------
def get_one( info, token, dev_serial ):
    global cf, filename, signin_token, reset_token

    query = f'''
        query {{
            current_info_one(serial_number: "{dev_serial}") {{
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
            }}
        }}
    '''
    dataBody = '{"query" : '+json.dumps(query)+'}'
    dataHead = { 
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    resp = requests.get(info['api_URL'], data=dataBody, headers=dataHead)

    if (resp.status_code!=200):
        sys_error = f'''
--------------------------------
    Error occured in file "{filename}" at line {cf.f_lineno}
    {json.loads(resp.text)}
--------------------------------
'''
        return print(sys_error)
    
    data = resp.json()['data']['current_info_one']

    print(data)
    # return data


def main():
    global cf, filename, signin_token, reset_token
    """
    This is the main entry point for the program
    """

    global_file = open ('./global.json', "r")
    global_data = json.loads(global_file.read())
    global_file.close()

    print('---------------------- Login DATA ----------------------')
    login( global_data )
    print('---------------------- All DATA ----------------------')
    get_all( global_data, signin_token)
    print('---------------------- One Dev DATA ----------------------')
    get_one( global_data, signin_token, 'serial_edgeone01_98789')

    print('')
    


if __name__ == "__main__":
    main()