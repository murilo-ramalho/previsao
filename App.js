import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet } from 'react-native';
import axios from 'axios';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification from 'react-native-push-notification';

const App = () => {
  const [cep, setCep] = useState('');
  const [formattedCep, setFormattedCep] = useState('');
  const [cepResult, setCepResult] = useState('');
  const [weatherResult, setWeatherResult] = useState([]);
  const [savedCity, setSavedCity] = useState(null);

  useEffect(() => {
    loadSavedCity();
  }, []);

  const formatCep = (text) => {
    const numericOnly = text.replace(/[^\d]/g, '');
    const formatted = numericOnly.replace(/(\d{5})(\d{0,3})/, '$1-$2');
    setCep(formatted);
    setFormattedCep(formatted);
  };

  const fetchCep = async () => {
    try {
      const response = await axios.get(`https://brasilapi.com.br/api/cep/v2/${cep}`);
      const { state, city, neighborhood, street } = response.data;
      const cityInfo = await fetchCityInfo(city);

      if (cityInfo && cityInfo.latitude && cityInfo.longitude) {
        setSavedCity({
          latitude: parseFloat(cityInfo.latitude),
          longitude: parseFloat(cityInfo.longitude),
        });
      }

      setCepResult(`Estado: ${state}\nCidade: ${city}\nBairro: ${neighborhood || 'Não informado'}\nRua: ${street || 'Não informado'}`);

      if (cityInfo) {
        const weatherData = await fetchWeather(cityInfo.id);
        setWeatherResult(weatherData);

        saveCity(cityInfo);

        // Agendamento da notificação
        scheduleNotification(`Previsão do Tempo para ${city} amanhã: ${weatherData[1].condicao_desc}`);
      } else {
        setWeatherResult([]);
      }
    } catch (error) {
      setCepResult('CEP não encontrado');
      setWeatherResult([]);
    }
  };

  const fetchCityInfo = async (cityName) => {
    try {
      const response = await axios.get(`https://brasilapi.com.br/api/cptec/v1/cidade/${encodeURIComponent(cityName)}`);
      const cityInfo = response.data[0];
      return cityInfo;
    } catch (error) {
      console.error('Erro ao obter informações da cidade:', error);
      return null;
    }
  };

  const fetchWeather = async (cityId) => {
    try {
      const response = await axios.get(`https://brasilapi.com.br/api/cptec/v1/clima/previsao/${cityId}/5`);
      const weatherData = response.data.clima;
      return weatherData;
    } catch (error) {
      console.error('Erro ao obter a previsão do tempo:', error);
      return [];
    }
  };

  const renderWeatherCondition = (condition) => {
    switch (condition) {
      case 'c':
        return '☀️';
      case 'ci':
        return '🌤️';
      case 'pnt':
        return '⛅';
      case 'pn':
        return '🌧️';
      case 'ps':
        return '🌧️';
      case 'e':
        return '🌩️';
      default:
        return '';
    }
  };

  const saveCity = async (cityInfo) => {
    try {
      await AsyncStorage.setItem('savedCity', JSON.stringify(cityInfo));
    } catch (error) {
      console.error('Erro ao salvar a cidade:', error);
    }
  };

  const loadSavedCity = async () => {
    try {
      const savedCityData = await AsyncStorage.getItem('savedCity');
      if (savedCityData) {
        const cityInfo = JSON.parse(savedCityData);

        // Adicionamos uma verificação extra para garantir que as coordenadas sejam válidas
        if (cityInfo.latitude && cityInfo.longitude) {
          setSavedCity({
            latitude: parseFloat(cityInfo.latitude),
            longitude: parseFloat(cityInfo.longitude),
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar a cidade salva:', error);
    }
  };

  const scheduleNotification = (message) => {
    PushNotification.localNotification({
      title: 'Previsão do Tempo',
      message,
    });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Digite o CEP"
        keyboardType="numeric"
        value={formattedCep}
        onChangeText={(text) => formatCep(text)}
      />
      <Button title="Consultar" onPress={() => fetchCep()} />
      <Text style={styles.resultText}>Resultado do CEP:</Text>
      <Text>{cepResult}</Text>
      <Text style={styles.resultText}>Previsão do Tempo:</Text>
      <ScrollView style={styles.scrollView}>
        {weatherResult.map((day, index) => (
          <View key={index} style={styles.weatherDay}>
            <Text style={styles.weatherDayText}>{`Data: ${day.data}`}</Text>
            <Text>{`Condição: ${renderWeatherCondition(day.condicao)}`}</Text>
            <Text>{`Mínima: ${day.min}°C, Máxima: ${day.max}°C`}</Text>
            <Text>{`Condição: ${day.condicao_desc}`}</Text>
            <Text>{`UV: ${day.indice_uv}`}</Text>
          </View>
        ))}
      </ScrollView>
      {savedCity && savedCity.latitude && savedCity.longitude && (
        <MapView style={styles.map} region={{ latitude: savedCity.latitude, longitude: savedCity.longitude, latitudeDelta: 0.0922, longitudeDelta: 0.0421 }}>
          <Marker coordinate={{ latitude: savedCity.latitude, longitude: savedCity.longitude }} title="Cidade Salva" />
        </MapView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    padding: 8,
  },
  resultText: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  scrollView: {
    maxHeight: 200,
    marginTop: 8,
  },
  weatherDay: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  weatherDayText: {
    fontWeight: 'bold',
  },
  map: {
    width: '100%',
    height: 200,
    marginTop: 16,
  },
});

export default App;
