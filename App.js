import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet } from 'react-native';
import axios from 'axios';

const App = () => {
  const [cep, setCep] = useState('');
  const [formattedCep, setFormattedCep] = useState('');
  const [cepResult, setCepResult] = useState('');
  const [weatherResult, setWeatherResult] = useState([]);

  const formatCep = (text) => {
    // Remove caracteres não numéricos
    const numericOnly = text.replace(/[^\d]/g, '');

    // Adiciona "-" a cada 5 caracteres
    const formatted = numericOnly.replace(/(\d{5})(\d{0,3})/, '$1-$2');

    setCep(formatted);
    setFormattedCep(formatted);
  };

  const fetchCep = async () => {
    try {
      const response = await axios.get(`https://brasilapi.com.br/api/cep/v2/${cep}`);
      const { state, city, neighborhood, street } = response.data;
      setCepResult(`Estado: ${state}\nCidade: ${city}\nBairro: ${neighborhood}\nRua: ${street}`);

      // Chama a função para buscar o ID da cidade
      const cityInfo = await fetchCityInfo(city);

      // Se a informação da cidade for obtida com sucesso, chama a função de previsão do tempo
      if (cityInfo) {
        const weatherData = await fetchWeather(cityInfo.id);
        setWeatherResult(weatherData);
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
      
      // Considera apenas o primeiro item no caso de múltiplos resultados
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
        return '☀️'; // Sol
      case 'ci':
        return '🌤️'; // Parcialmente nublado
      case 'pnt':
        return '⛅'; // Pancadas de chuva à tarde
      case 'pn':
        return '🌧️'; // Pancadas de chuva à noite
      case 'ps':
        return '🌧️'; // Pancadas de chuva pela manhã
      case 'e':
        return '🌩️'; // Encoberto com chuvas isoladas
      // Adicione mais casos conforme necessário para outros tipos de condições climáticas
      default:
        return '';
    }
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
      <Text style={styles.resultText}>Resultado da Previsão do Tempo:</Text>
      <ScrollView style={styles.scrollView}>
        {weatherResult.map((day, index) => (
          <View key={index} style={styles.weatherDay}>
            <Text style={styles.weatherDayText}>{`Data: ${day.data}`}</Text>
            <Text>{`Condição: ${renderWeatherCondition(day.condicao)}`}</Text>
            <Text>{`Mínima: ${day.min}°C, Máxima: ${day.max}°C`}</Text>
          </View>
        ))}
      </ScrollView>
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
    maxHeight: 200, // Defina uma altura máxima para a ScrollView
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
});

export default App;
